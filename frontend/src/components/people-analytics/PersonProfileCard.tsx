// Last Modified: 2025-11-23 17:30
// Person Profile Card Component

import { PersonExtended } from '../../types/people-analytics';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  MapPin,
  Briefcase,
  Linkedin,
  Twitter,
  Globe,
} from 'lucide-react';

interface PersonProfileCardProps {
  person: PersonExtended;
}

export function PersonProfileCard({ person }: PersonProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-950/20';
    if (score >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
    return 'text-red-600 bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">Assistants</h3>
        <button className="p-1 hover:bg-accent rounded">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Profile Image */}
      <div className="flex justify-center">
        <Avatar className="h-32 w-32">
          <AvatarImage src={person.profileImageUrl} alt={person.fullName} />
          <AvatarFallback className="text-3xl">
            {getInitials(person.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name and Title */}
      <div className="text-center">
        <h4 className="text-xl font-bold">{person.fullName}</h4>
        {person.jobTitle && (
          <p className="text-sm text-muted-foreground mt-1">{person.jobTitle}</p>
        )}
        {person.company && (
          <p className="text-sm text-muted-foreground">{person.company}</p>
        )}
      </div>

      {/* Score */}
      <div className="flex justify-center">
        <div className={`px-4 py-2 rounded-full ${getScoreColor(person.relationshipScore)}`}>
          <span className="text-2xl font-bold">{person.relationshipScore}</span>
          <span className="text-sm ml-1">/ 100</span>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Mail className="h-4 w-4" />
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Phone className="h-4 w-4" />
        </button>
        <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-full border hover:bg-accent transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-3 pt-4 border-t">
        {person.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{person.email}</span>
          </div>
        )}

        {person.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{person.phone}</span>
          </div>
        )}

        {person.locationCity && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>
              {person.locationCity}
              {person.locationState && `, ${person.locationState}`}
            </span>
          </div>
        )}

        {person.industry && (
          <div className="flex items-center gap-3 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{person.industry}</span>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(person.linkedinUrl || person.twitterUrl || person.websiteUrl) && (
        <div className="flex gap-2 pt-4 border-t">
          {person.linkedinUrl && (
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {person.twitterUrl && (
            <a
              href={person.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {person.websiteUrl && (
            <a
              href={person.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold">{person.totalInteractions}</p>
          <p className="text-xs text-muted-foreground">Interactions</p>
        </div>
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm font-medium capitalize">{person.contactFrequency}</p>
          <p className="text-xs text-muted-foreground">Frequency</p>
        </div>
      </div>
    </div>
  );
}
