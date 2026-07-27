"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Key, Database, Bell, User } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Управление настройками аккаунта и интеграций
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Ключи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>OpenAI API Key</Label>
              <Input type="password" placeholder="sk-..." />
              <p className="mt-1 text-xs text-zinc-400">
                Используется для AI аудита, генерации контента и рекомендаций
              </p>
            </div>
            <Button onClick={handleSave} className="gap-2">
              {saved ? "Сохранено" : "Сохранить API ключ"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              База данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>URL базы данных</Label>
              <Input type="password" placeholder="postgresql://..." />
              <p className="mt-1 text-xs text-zinc-400">
                Строка подключения PostgreSQL
              </p>
            </div>
            <Button onClick={handleSave} className="gap-2">
              {saved ? "Сохранено" : "Сохранить"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email уведомления</p>
                <p className="text-xs text-zinc-400">Получать обновления о статусе подач</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Еженедельные отчёты аудита</p>
                <p className="text-xs text-zinc-400">Получать еженедельные сводки AI аудита</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Аккаунт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Имя</Label>
              <Input defaultValue="Admin" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="admin@seoflowai.com" />
            </div>
            <Button onClick={handleSave} className="gap-2">
              {saved ? "Сохранено" : "Обновить профиль"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
