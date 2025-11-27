// Last Modified: 2025-11-23 17:30
// Top Contacts Widget Component

import { PersonExtended } from '../../types/people-analytics';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Mail, Phone, MessageSquare } from 'lucide-react';

interface TopContactsWidgetProps {
  contacts: PersonExtended[];
}

export function TopContactsWidget({ contacts }: TopContactsWidgetProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Top Contacts</h3>
        <p className="text-sm text-muted-foreground">
          Your most frequent interactions
        </p>
      </div>

      <div className="space-y-3">
        {contacts.length > 0 ? (
          contacts.map((person, index) => (
            <div
              key={person.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{index + 1}</span>
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={person.profileImageUrl} alt={person.fullName} />
                <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{person.fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {person.company && (
                    <p className="text-xs text-muted-foreground truncate">
                      {person.company}
                    </p>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {person.totalInteractions} interactions
                  </Badge>
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <p className={`text-lg font-bold ${getScoreColor(person.relationshipScore)}`}>
                  {person.relationshipScore}
                </p>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No contacts yet</p>
          </div>
        )}
      </div>

      {/* Contact Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors">
          <Mail className="h-4 w-4" />
          <span className="text-sm">Email</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors">
          <Phone className="h-4 w-4" />
          <span className="text-sm">Call</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">SMS</span>
        </button>
      </div>
    </div>
  );
}
