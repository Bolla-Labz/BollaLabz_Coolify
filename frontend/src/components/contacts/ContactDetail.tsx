// Last Modified: 2025-11-23 17:30
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  Star,
  Edit,
  MessageSquare,
  Clock,
  TrendingUp,
  User,
  Briefcase,
  Globe,
  Twitter,
  Linkedin,
  Github,
} from 'lucide-react';
import { format } from 'date-fns';
import { VoiceCallButton } from '@/components/voice';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  role?: string;
  avatar?: string;
  tags: string[];
  lastContact: Date;
  isFavorite: boolean;
  relationshipScore: number;
  notes?: string;
  address?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  interactions?: {
    date: Date;
    type: 'call' | 'email' | 'meeting' | 'message';
    summary: string;
  }[];
}

interface ContactDetailProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contact: Contact) => void;
}

export function ContactDetail({ contact, isOpen, onClose, onEdit }: ContactDetailProps) {
  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback>
                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{contact.name}</h2>
                  {contact.isFavorite && (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                {contact.role && contact.company && (
                  <p className="text-muted-foreground">
                    {contact.role} at {contact.company}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {contact.relationshipScore}% Score
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last contact: {format(contact.lastContact, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <VoiceCallButton
                phoneNumber={contact.phone}
                contactName={contact.name}
                variant="outline"
                size="sm"
              />
              <Button onClick={() => onEdit?.(contact)} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {contact.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col p-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="text-sm hover:text-primary">
                      {contact.phone}
                    </a>
                  </div>
                  {contact.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{contact.address}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{contact.company}</span>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary"
                      >
                        {contact.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {contact.socialMedia && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Social Media</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    {contact.socialMedia.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://twitter.com/${contact.socialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {contact.socialMedia.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://linkedin.com/in/${contact.socialMedia.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {contact.socialMedia.github && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://github.com/${contact.socialMedia.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              {contact.interactions && contact.interactions.length > 0 ? (
                contact.interactions.map((interaction, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            {interaction.type === 'call' && <Phone className="w-4 h-4 text-primary" />}
                            {interaction.type === 'email' && <Mail className="w-4 h-4 text-primary" />}
                            {interaction.type === 'meeting' && <Calendar className="w-4 h-4 text-primary" />}
                            {interaction.type === 'message' && <MessageSquare className="w-4 h-4 text-primary" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{interaction.type}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {interaction.summary}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(interaction.date, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No interactions recorded yet
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {contact.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      No notes added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Activity timeline coming soon
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}