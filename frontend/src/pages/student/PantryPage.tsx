import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const PantryPage = () => {
  return (
    <ModulePlaceholder
      title="Pantry and Ingredient Tracking"
      owner="Member 3"
      summary="Track ingredient quantities and expiry dates to reduce waste and improve planning."
      crudItems={[
        'Create: add pantry ingredients',
        'Read: view quantity and expiry status',
        'Update: modify quantity and units',
        'Delete: remove consumed or expired items',
      ]}
      nextSteps={[
        'Build pantry table with status badges',
        'Implement item quantity adjustment controls',
        'Prepare hooks for expiry alert integration',
      ]}
    />
  )
}

export default PantryPage
