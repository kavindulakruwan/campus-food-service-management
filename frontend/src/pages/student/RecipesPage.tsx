import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const RecipesPage = () => {
  return (
    <ModulePlaceholder
      title="Recipe Sharing"
      owner="Member 4"
      summary="Community module for uploading, browsing, and maintaining student recipes."
      crudItems={[
        'Create: upload recipes with ingredients and steps',
        'Read: browse and search recipes',
        'Update: edit own recipe details',
        'Delete: remove own recipes',
      ]}
      nextSteps={[
        'Create recipe cards and detail page',
        'Add recipe create and edit forms',
        'Connect recipes with pantry ingredient suggestions',
      ]}
    />
  )
}

export default RecipesPage
