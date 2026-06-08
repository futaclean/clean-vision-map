DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Cleaners can notify report owners"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  related_report_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.waste_reports wr
    WHERE wr.id = notifications.related_report_id
      AND wr.assigned_to = auth.uid()
      AND wr.user_id = notifications.user_id
  )
);