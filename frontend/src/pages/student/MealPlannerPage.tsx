import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const MealPlannerPage = () => {
  return (
    <ModulePlaceholder
      title="Meal Planning"
      owner="Member 2"
      summary="Weekly scheduling flow for breakfast, lunch, and dinner planning."
      crudItems={[
        'Create: add planned meals by date and meal time',
        'Read: fetch weekly and monthly meal plans',
        'Update: modify planned meals and quantities',
        'Delete: remove meals from plan',
      ]}
      nextSteps={[
        'Build calendar or week-grid planner UI',
        'Connect to meal planning API endpoints',
        'Add duplicate and quick-copy week actions',
      ]}
    />
  )
}

export default MealPlannerPage
