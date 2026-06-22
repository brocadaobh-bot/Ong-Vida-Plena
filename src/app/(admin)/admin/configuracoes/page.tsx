import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { SettingsForm } from './SettingsForm'

export default async function ConfiguracoesAdminPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value, description')
    .order('key')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Parâmetros gerais da plataforma. Alterações booleanas (Sim/Não) são salvas ao selecionar.
        </p>
      </div>

      {!settings || settings.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-12 text-center">
          <Settings className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhuma configuração encontrada.</p>
        </div>
      ) : (
        <SettingsForm settings={settings} />
      )}
    </div>
  )
}
