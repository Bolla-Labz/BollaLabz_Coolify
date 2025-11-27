// Last Modified: 2025-11-23 17:30
import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, CreditCard, Database } from 'lucide-react';

export default function Settings() {
  const settingsSections = [
    { icon: User, label: 'Profile', description: 'Manage your account information' },
    { icon: Bell, label: 'Notifications', description: 'Configure notification preferences' },
    { icon: Shield, label: 'Security', description: 'Password and authentication settings' },
    { icon: Palette, label: 'Appearance', description: 'Theme and display preferences' },
    { icon: CreditCard, label: 'Billing', description: 'Manage subscription and payments' },
    { icon: Database, label: 'Data & Privacy', description: 'Export data and privacy settings' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              className="p-6 rounded-lg border bg-card hover:bg-muted/50 transition-all hover:shadow-md text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{section.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}