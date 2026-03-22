import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const OrdersPage = () => {
  return (
    <ModulePlaceholder
      title="Orders"
      owner="Shared"
      summary="Order lifecycle page scaffold for creating and tracking meal orders."
      crudItems={[
        'Create: place a new meal order',
        'Read: view active and past orders',
        'Update: modify pending order details',
        'Delete: cancel pending orders',
      ]}
      nextSteps={[
        'Build order list and status timeline',
        'Attach payment state per order',
        'Add order detail panel and actions',
      ]}
    />
  )
}

export default OrdersPage
