import ModulePlaceholder from '../../components/ui/ModulePlaceholder'

const ProfilePage = () => {
  return (
    <ModulePlaceholder
      title="User and Profile Management"
      owner="Member 1"
      summary="Authentication and profile module with ownership over user identity and preferences."
      crudItems={[
        'Create: student account registration',
        'Read: user profile and preferences',
        'Update: diet type, allergies, budget preference',
        'Delete: user account and related profile data',
      ]}
      nextSteps={[
        'Add profile form linked to backend profile API',
        'Implement update and delete account actions',
        'Add route guards by role and session expiration handling',
      ]}
    />
  )
}

export default ProfilePage
