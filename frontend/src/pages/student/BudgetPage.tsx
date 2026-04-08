import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const BudgetPage = () => {
  return (
    <ModulePlaceholder
      title="Budget Tracking"
      owner="Member 4"
      summary="Manage spending limits and compare budget targets against meal costs."
      crudItems={[
        'Create: set monthly or weekly budget',
        'Read: view spending summary and trends',
        'Update: adjust budget limits and categories',
        'Delete: reset budget records',
      ]}
      nextSteps={[
        'Add monthly summary cards and budget bar charts',
        'Build transaction log table',
        'Connect spending data with orders and pantry purchases',
      ]}
    />
  )
}

export default BudgetPage
