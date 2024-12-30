import { Card } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { redirect } from 'next/navigation'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Página de Test</h1>
        <p className="text-muted-foreground">
          Has iniciado sesión correctamente y has sido redirigido a la página de test.
        </p>
        <p>Hello {data.user.email}</p>
      </Card>
    </div>
  )
}
