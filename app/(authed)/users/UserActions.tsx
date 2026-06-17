"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { restrictUser, unrestrictUser } from "./actions";

interface Props {
  userId: string;
  restricted: boolean;
}

export function UserActions({ userId, restricted }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handle(
    fn: () => Promise<{ ok?: boolean; error?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(successMsg);
    });
  }

  if (restricted) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => handle(() => unrestrictUser(userId), "Desbloqueado")}
      >
        ✓ Desbloquear
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        🚫 Restringir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restringir usuario</DialogTitle>
            <DialogDescription>
              Bloqueará la cuenta inmediatamente: no podrá enviar más recuerdos
              hasta que la desbloquees. Razón opcional pero recomendada para
              auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Razón (opcional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: spam reiterado, fraude detectado"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handle(
                  () => restrictUser(userId, reason),
                  "Usuario restringido",
                );
                setOpen(false);
                setReason("");
              }}
              disabled={pending}
            >
              Confirmar restricción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
