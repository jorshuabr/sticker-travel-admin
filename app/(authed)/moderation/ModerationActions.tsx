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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  approveMemory,
  delegateToAI,
  rejectMemory,
} from "./actions";
import { REJECTION_REASONS, type RejectionReason } from "@/lib/types";

interface Props {
  memoryId: string;
}

export function ModerationActions({ memoryId }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<RejectionReason>("pegatina_ajena");
  const [reasonText, setReasonText] = useState("");
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

  function handleReject() {
    const text = reason === "other" ? reasonText.trim() || null : null;
    handle(
      () => rejectMemory(memoryId, reason, text),
      "Rechazado",
    );
    setRejectOpen(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => handle(() => approveMemory(memoryId), "Aprobado")}
      >
        ✅ Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => setRejectOpen(true)}
      >
        ❌ Rechazar
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          handle(() => delegateToAI(memoryId), "Delegado a la IA")
        }
      >
        🤖 IA
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar recuerdo</DialogTitle>
            <DialogDescription>
              Elige el motivo del rechazo. El usuario lo verá en su álbum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as RejectionReason)}
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="reason-text">Texto del motivo</Label>
                <Input
                  id="reason-text"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Describe brevemente el motivo"
                  maxLength={500}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reason === "other" && !reasonText.trim()}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
