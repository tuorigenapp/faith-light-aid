import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Reconectando" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("¡Bienvenido de vuelta!");
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cuenta creada. Revisa tu correo si se requiere verificación.");
    navigate({ to: "/diagnostico" });
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { setLoading(false); toast.error("No se pudo iniciar con Google"); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  async function appleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { setLoading(false); toast.error("No se pudo iniciar con Apple"); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative z-10 p-12 h-full flex flex-col justify-between text-white">
          <Link to="/" className="font-display text-xl">Reconectando</Link>
          <div>
            <p className="scripture text-gold text-lg">"En Cristo somos más que vencedores."</p>
            <p className="mt-1 text-white/70 text-sm">Romanos 8:37</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl text-foreground">Bienvenido</h1>
          <p className="mt-2 text-muted-foreground text-sm">Tu camino de restauración empieza aquí.</p>

          <div className="mt-8 grid gap-2.5">
            <Button onClick={googleSignIn} disabled={loading} variant="outline" className="w-full h-11">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar con Google
            </Button>
            <Button onClick={appleSignIn} disabled={loading} variant="outline" className="w-full h-11">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.426 2.227-1.137 3.06-.79.927-2.083 1.65-3.146 1.567-.13-1.106.42-2.27 1.136-3.058.795-.87 2.13-1.527 3.147-1.569zM20.5 17.43c-.55 1.276-.812 1.846-1.518 2.974-.987 1.578-2.38 3.544-4.106 3.56-1.534.015-1.93-1.005-4.013-.993-2.085.012-2.52 1.01-4.058.993-1.725-.016-3.043-1.79-4.03-3.368C.038 16.226-.45 11.196 1.247 8.516c1.21-1.91 3.115-3.026 4.91-3.026 1.823 0 2.97.998 4.475.998 1.46 0 2.35-1 4.46-1 1.597 0 3.29.87 4.49 2.378-3.945 2.16-3.302 7.795.918 9.564z"/></svg>
              Continuar con Apple
            </Button>
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> O CON CORREO <div className="flex-1 h-px bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 mt-4">
                <div><Label>Correo</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Contraseña</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button disabled={loading} type="submit" className="w-full h-11 bg-primary">Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 mt-4">
                <div><Label>Nombre completo</Label><Input required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                <div><Label>Correo</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Contraseña</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button disabled={loading} type="submit" className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90">Crear cuenta gratis</Button>
                <p className="text-[11px] text-muted-foreground text-center">Al crear tu cuenta aceptas nuestro acompañamiento espiritual. Esta herramienta no reemplaza ayuda profesional.</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
