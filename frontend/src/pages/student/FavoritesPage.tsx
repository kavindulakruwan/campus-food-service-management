import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const FavoritesPage = () => {
  return (
    <ModulePlaceholder
      title="Campus Dining Favorites"
      owner="Member 2"
      summary="Bookmark and rate favorite meals for quick reuse in planning and orders."
      crudItems={[
        'Create: save favorite meal entries',
        'Read: list saved favorites by user',
        'Update: edit ratings, tags, and notes',
        'Delete: remove favorite entries',
      ]}
      nextSteps={[
        'Create favorite cards and filtering controls',
        'Sync favorites with meal planner suggestions',
        'Add meal rating and note editor modal',
      ]}
    />
  )
}

export default FavoritesPage
