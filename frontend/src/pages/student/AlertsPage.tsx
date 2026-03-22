import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const AlertsPage = () => {
  return (
    <ModulePlaceholder
      title="Food Waste Alerts"
      owner="Member 3"
      summary="Reminder and notification center for upcoming ingredient expiration."
      crudItems={[
        'Create: set alert timing for ingredients',
        'Read: list upcoming and triggered alerts',
        'Update: change reminder windows',
        'Delete: dismiss or remove reminders',
      ]}
      nextSteps={[
        'Create alerts timeline and urgency tags',
        'Add snooze and complete actions',
        'Link each alert to pantry item details',
      ]}
    />
  )
}

export default AlertsPage
