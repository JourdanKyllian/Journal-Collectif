"use client";

import { PenSquare, Trash2, ShieldAlert, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersDashboard() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
          <UserIcon className="text-vert" /> Utilisateurs
        </h1>
        <p className="font-raleway text-champagne text-sm">Gérez les accès et les rôles de la plateforme</p>
      </div>

      <div className="bg-blanc rounded-2xl border border-champagne/20 overflow-hidden mt-6">
        <Table>
          <TableHeader className="bg-champagne/5">
            <TableRow className="hover:bg-transparent border-champagne/20">
              <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Utilisateur</TableHead>
              <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Rôle</TableHead>
              <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Inscription</TableHead>
              <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Utilisateur 1 : Admin */}
            <TableRow className="hover:bg-champagne/5 border-champagne/10 transition-colors">
              <TableCell>
                <div className="font-montserrat font-bold text-sm text-noir">Admin Chalonnais</div>
                <div className="font-montserrat text-xs text-champagne">admin@chalonnais.fr</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge className="bg-or text-noir hover:bg-or/90 border-0 font-poppins font-black text-xs flex items-center gap-1 w-fit">
                  <ShieldAlert size={12} /> Admin
                </Badge>
              </TableCell>
              <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">1er jan. 2026</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="bg-champagne/20 text-vert hover:bg-champagne/40 rounded-lg h-8 w-8">
                  <PenSquare size={14} />
                </Button>
              </TableCell>
            </TableRow>

            {/* Utilisateur 2 : Citoyen */}
            <TableRow className="hover:bg-champagne/5 border-champagne/10 transition-colors">
              <TableCell>
                <div className="font-montserrat font-bold text-sm text-noir">Jean Dupont</div>
                <div className="font-montserrat text-xs text-champagne">jean@exemple.fr</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge className="bg-champagne/30 text-vert hover:bg-champagne/40 border-0 font-poppins font-black text-xs flex items-center gap-1 w-fit">
                  <UserIcon size={12} /> Utilisateur
                </Badge>
              </TableCell>
              <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">12 fév. 2026</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="icon" className="bg-champagne/20 text-vert hover:bg-champagne/40 rounded-lg h-8 w-8">
                    <PenSquare size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}