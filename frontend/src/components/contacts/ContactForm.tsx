// Last Modified: 2025-11-24 00:00
import React, { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Tag,
  X,
  Plus,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useContactsStore } from '@/stores/contactsStore';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  company: z.string().optional(),
  role: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ContactFormData) => void;
}

export function ContactForm({ contact, isOpen, onClose, onSubmit }: ContactFormProps) {
  const { addContact, updateContact } = useContactsStore();
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [avatar, setAvatar] = useState(contact?.avatar || '');
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      role: contact?.role || '',
      address: contact?.address || '',
      website: contact?.website || '',
      notes: contact?.notes || '',
      twitter: contact?.socialMedia?.twitter || '',
      linkedin: contact?.socialMedia?.linkedin || '',
      github: contact?.socialMedia?.github || '',
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    startTransition(async () => {
      try {
        const contactData = {
          ...data,
          id: contact?.id || Date.now().toString(),
          tags,
          avatar,
          isFavorite: contact?.isFavorite || false,
          lastContact: contact?.lastContact || new Date(),
          relationshipScore: contact?.relationshipScore || 75,
          socialMedia: {
            twitter: data.twitter,
            linkedin: data.linkedin,
            github: data.github,
          },
        };

        if (contact) {
          await updateContact(contact.id, contactData);
        } else {
          await addContact(contactData);
        }

        onSubmit?.(data);
        handleClose();
      } catch (error) {
        // Error is already handled by the store (toast shown)
        // Just log it here for debugging
        console.error('Failed to save contact:', error);
      }
    });
  };

  const handleClose = () => {
    reset();
    setTags([]);
    setNewTag('');
    setAvatar('');
    onClose();
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'New Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="social">Social & Tags</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>
                    <User className="w-8 h-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    placeholder="Avatar URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter an image URL or upload an avatar
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <Input {...register('name')} placeholder="John Doe" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </label>
                <Input {...register('email')} type="email" placeholder="john@example.com" />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </label>
                <Input {...register('phone')} placeholder="+1 (555) 123-4567" />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {/* Company & Role */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Company
                  </label>
                  <Input {...register('company')} placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Role
                  </label>
                  <Input {...register('role')} placeholder="CEO" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input {...register('address')} placeholder="123 Main St, City, State 12345" />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                <Input {...register('website')} placeholder="https://example.com" />
                {errors.website && (
                  <p className="text-xs text-destructive">{errors.website.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              {/* Social Media */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter Username
                    </label>
                    <Input {...register('twitter')} placeholder="johndoe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Username
                    </label>
                    <Input {...register('linkedin')} placeholder="johndoe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Username
                    </label>
                    <Input {...register('github')} placeholder="johndoe" />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  {...register('notes')}
                  className="w-full min-h-[200px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add any notes about this contact..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending || isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isSubmitting}
              className={isPending || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isPending || isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}