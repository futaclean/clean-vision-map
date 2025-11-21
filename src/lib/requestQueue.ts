import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface QueuedRequest {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Request queue manager to handle failed API requests
 * Automatically retries requests when connection is restored
 */
class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private storageKey = 'offline_request_queue';

  constructor() {
    // Load queue from localStorage on initialization
    this.loadQueue();
    
    // Listen for online events to process queue
    window.addEventListener('online', () => this.processQueue());
  }

  /**
   * Add a request to the queue
   */
  add(type: QueuedRequest['type'], table: string, data: any) {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(request);
    this.saveQueue();

    console.log('Request added to queue:', request);

    toast({
      title: 'Request Queued',
      description: 'Your changes will be synced when connection is restored.',
    });
  }

  /**
   * Process all queued requests
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Processing ${this.queue.length} queued requests...`);

    const successfulRequests: string[] = [];
    const failedRequests: QueuedRequest[] = [];

    for (const request of this.queue) {
      try {
        const success = await this.executeRequest(request);
        
        if (success) {
          successfulRequests.push(request.id);
          console.log('Request processed successfully:', request.id);
        } else {
          request.retryCount++;
          if (request.retryCount < this.maxRetries) {
            failedRequests.push(request);
          } else {
            console.error('Request exceeded max retries:', request.id);
          }
        }
      } catch (error) {
        console.error('Error processing request:', request.id, error);
        request.retryCount++;
        if (request.retryCount < this.maxRetries) {
          failedRequests.push(request);
        }
      }
    }

    // Update queue with only failed requests
    this.queue = failedRequests;
    this.saveQueue();

    if (successfulRequests.length > 0) {
      toast({
        title: 'Data Synced',
        description: `Successfully synced ${successfulRequests.length} change${successfulRequests.length !== 1 ? 's' : ''}.`,
      });
    }

    if (failedRequests.length > 0) {
      toast({
        title: 'Sync Incomplete',
        description: `${failedRequests.length} change${failedRequests.length !== 1 ? 's' : ''} will be retried later.`,
        variant: 'destructive',
      });
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<boolean> {
    try {
      let result;

      switch (request.type) {
        case 'insert':
          result = await (supabase.from as any)(request.table).insert(request.data);
          break;
        
        case 'update':
          const { id, ...updateData } = request.data;
          result = await (supabase.from as any)(request.table)
            .update(updateData)
            .eq('id', id);
          break;
        
        case 'delete':
          result = await (supabase.from as any)(request.table)
            .delete()
            .eq('id', request.data.id);
          break;
      }

      return !result.error;
    } catch (error) {
      console.error('Request execution failed:', error);
      return false;
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to localStorage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.queue = JSON.parse(saved);
        console.log('Loaded queue from localStorage:', this.queue.length, 'requests');
      }
    } catch (error) {
      console.error('Failed to load queue from localStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Clear the queue (useful for debugging)
   */
  clear() {
    this.queue = [];
    this.saveQueue();
    console.log('Queue cleared');
  }

  /**
   * Get current queue size
   */
  size() {
    return this.queue.length;
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();
