import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ManagedImage } from "@/components/ManagedImage";
import { useAuth } from "@/lib/use-auth";
import { createDeletionConfirmation, deletionPreferenceKey, registerDeletionConfirmation } from "@/lib/deletion-confirmation";
import logo from "@/assets/logo-origen.png";
import { Trash2 } from "lucide-react";

export function DeletionConfirmation() {
  const { user } = useAuth();
  const scope = useRef(user?.id ?? "guest");
  scope.current = user?.id ?? "guest";
  const [remember, setRemember] = useState(false);
  const [controller] = useState(() => {
    const fallback = new Set<string>();
    return createDeletionConfirmation({
      getScope: () => scope.current,
      readPreference: id => {
        try { return fallback.has(id) || localStorage.getItem(deletionPreferenceKey(id)) === "skip"; }
        catch { return fallback.has(id); }
      },
      savePreference: id => {
        fallback.add(id);
        try { localStorage.setItem(deletionPreferenceKey(id), "skip"); } catch { /* Still works for this session. */ }
      },
    });
  });
  const pending = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => null);
  useEffect(() => {
    const unregister = registerDeletionConfirmation(controller.request);
    return () => { unregister(); controller.cancelAll(); };
  }, [controller]);
  useEffect(() => { controller.cancelAll(); }, [user?.id, controller]);
  useEffect(() => { setRemember(false); }, [pending]);

  return (
    <AlertDialog open={!!pending} onOpenChange={open => { if (!open) controller.decide(false); }}>
      <AlertDialogContent className="z-[200] w-[calc(100%-32px)] max-w-sm rounded-[16px] border-border bg-card p-5 text-card-foreground shadow-soft motion-reduce:animate-none" overlayClassName="z-[199] bg-foreground/50 motion-reduce:animate-none">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <ManagedImage imageKey="imagen:logo" src={logo} alt="ORÍGEN" width={64} height={64} className="mb-2 h-16 w-16 object-contain" />
          <AlertDialogTitle className="font-display text-[22px]">¿Seguro que quieres eliminarlo?</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed">{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] bg-secondary/60 px-3 text-[14px]">
          <Checkbox checked={remember} onCheckedChange={value => setRemember(value === true)} />
          No volver a mostrar
        </label>
        <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
          <Button variant="outline" className="h-12 rounded-[12px] text-[15px]" onClick={() => controller.decide(false)}>Cancelar</Button>
          <Button variant="destructive" className="h-12 rounded-[12px] text-[15px]" onClick={() => controller.decide(true, remember)}><Trash2 />Eliminar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}