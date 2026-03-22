import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const PaymentsPage = () => {
  return (
    <ModulePlaceholder
      title="Payments"
      owner="Shared"
      summary="Payment flow scaffold including method management and transaction history."
      crudItems={[
        'Create: initiate payment for an order',
        'Read: view payment history',
        'Update: retry and update failed payments',
        'Delete: remove saved payment method',
      ]}
      nextSteps={[
        'Integrate payment provider and callbacks',
        'Build receipt view and invoice download',
        'Add transaction filtering by status and date',
      ]}
    />
  )
}

export default PaymentsPage
