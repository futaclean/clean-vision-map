import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedReportId?: string;
}

export const useNotifications = () => {
  const createNotification = async ({
    userId,
    title,
    message,
    type = 'info',
    relatedReportId
  }: CreateNotificationParams) => {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          related_report_id: relatedReportId
        }
      ]);

    if (error) {
      console.error('Error creating notification:', error);
      return { error };
    }

    return { error: null };
  };

  const notifyReportAssigned = async (cleanerId: string, reportId: string, location: string) => {
    return createNotification({
      userId: cleanerId,
      title: 'New Report Assigned',
      message: `You have been assigned to a waste report at ${location}`,
      type: 'info',
      relatedReportId: reportId
    });
  };

  const notifyReportStatusChanged = async (userId: string, reportId: string, newStatus: string, rejectionReason?: string) => {
    const statusMessages: Record<string, { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
      in_progress: {
        title: 'Report In Progress',
        message: 'A cleaner has started working on your waste report',
        type: 'info'
      },
      resolved: {
        title: 'Report Resolved',
        message: 'Your waste report has been successfully resolved!',
        type: 'success'
      },
      rejected: {
        title: 'Report Rejected',
        message: rejectionReason 
          ? `Your waste report has been rejected. Reason: ${rejectionReason}`
          : 'Your waste report has been rejected',
        type: 'warning'
      }
    };

    const notification = statusMessages[newStatus];
    if (!notification) return;

    return createNotification({
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedReportId: reportId
    });
  };

  const notifyNewReport = async (adminIds: string[], location: string) => {
    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      title: 'New Waste Report',
      message: `A new waste report has been submitted at ${location}`,
      type: 'info' as const
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating admin notifications:', error);
      return { error };
    }

    return { error: null };
  };

  return {
    createNotification,
    notifyReportAssigned,
    notifyReportStatusChanged,
    notifyNewReport
  };
};
