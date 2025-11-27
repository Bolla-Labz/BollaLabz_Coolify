// Last Modified: 2025-11-24 21:21
import React from 'react';
import { MultiStepForm, MultiStepFormStep } from '@/components/forms/MultiStepForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Globe,
  Tag,
  X,
  Plus,
  Twitter,
  Linkedin,
  Github,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { useContactsStore } from '@/stores/contactsStore';
import * as z from 'zod';

interface ContactFormMultiStepProps {
  contact?: any;
  onComplete: () => void;
}

/**
 * Multi-Step Contact Form - 5-step guided contact creation/editing
 *
 * Steps:
 * 1. Basic Information (name, phone, email)
 * 2. Personal Details (birthday, interests, tags)
 * 3. Professional Info (company, role, LinkedIn)
 * 4. Relationship Context (how met, importance, notes)
 * 5. Review & Submit
 */
export function ContactFormMultiStep({ contact, onComplete }: ContactFormMultiStepProps) {
  const { addContact, updateContact } = useContactsStore();

  const handleSubmit = async (data: any) => {
    const contactData = {
      ...data,
      id: contact?.id || Date.now().toString(),
      isFavorite: contact?.isFavorite || false,
      lastContact: contact?.lastContact || new Date(),
      relationshipScore: data.relationshipScore || 75,
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

    onComplete();
  };

  const steps: MultiStepFormStep[] = [
    // Step 1: Basic Information
    {
      title: 'Basic Information',
      description: 'Essential contact details',
      icon: <User className="h-4 w-4" />,
      content: <BasicInfoStep />,
      validate: async (data) => {
        const schema = z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Valid email is required'),
          phone: z.string().min(1, 'Phone is required'),
        });

        try {
          schema.parse(data);
          return true;
        } catch (error: any) {
          return error.errors[0]?.message || 'Please complete all required fields';
        }
      },
    },

    // Step 2: Personal Details
    {
      title: 'Personal Details',
      description: 'Birthday, interests, and categorization',
      icon: <Heart className="h-4 w-4" />,
      content: <PersonalDetailsStep />,
      optional: true,
    },

    // Step 3: Professional Info
    {
      title: 'Professional Info',
      description: 'Work details and social profiles',
      icon: <Briefcase className="h-4 w-4" />,
      content: <ProfessionalInfoStep />,
      optional: true,
    },

    // Step 4: Relationship Context
    {
      title: 'Relationship Context',
      description: 'How you met and relationship insights',
      icon: <MessageCircle className="h-4 w-4" />,
      content: <RelationshipContextStep />,
      optional: true,
    },

    // Step 5: Review & Submit
    {
      title: 'Review & Submit',
      description: 'Review all information before saving',
      icon: <User className="h-4 w-4" />,
      content: <ReviewStep />,
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={onComplete}
      initialData={contact || {}}
      storageKey={`contact-form-${contact?.id || 'new'}`}
      resumeOnMount={!contact}
      showProgress={true}
      allowSkipOptional={true}
    />
  );
}

// Step 1: Basic Information Component
function BasicInfoStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={data?.avatar} />
          <AvatarFallback>
            <User className="w-8 h-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input
            id="avatar"
            value={data?.avatar || ''}
            onChange={(e) => handleChange('avatar', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Enter an image URL
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Full Name *
        </Label>
        <Input
          id="name"
          value={data?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="John Doe"
          required
          autoFocus
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          value={data?.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="john@example.com"
          required
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Phone Number *
        </Label>
        <Input
          id="phone"
          type="tel"
          value={data?.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
        />
      </div>
    </div>
  );
}

// Step 2: Personal Details Component
function PersonalDetailsStep({ data, onChange }: any) {
  const [newTag, setNewTag] = React.useState('');
  const tags = data?.tags || [];

  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      onChange?.({ ...data, tags: [...tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange?.({ ...data, tags: tags.filter((t: string) => t !== tagToRemove) });
  };

  return (
    <div className="space-y-4">
      {/* Birthday */}
      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday</Label>
        <Input
          id="birthday"
          type="date"
          value={data?.birthday || ''}
          onChange={(e) => handleChange('birthday', e.target.value)}
        />
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label htmlFor="interests">Interests</Label>
        <Input
          id="interests"
          value={data?.interests || ''}
          onChange={(e) => handleChange('interests', e.target.value)}
          placeholder="Photography, Hiking, Technology"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of interests
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Label>
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
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag: string, idx: number) => (
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
      </div>
    </div>
  );
}

// Step 3: Professional Info Component
function ProfessionalInfoStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Company & Role */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company
          </Label>
          <Input
            id="company"
            value={data?.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Acme Corp"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Role
          </Label>
          <Input
            id="role"
            value={data?.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            placeholder="CEO"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Address
        </Label>
        <Input
          id="address"
          value={data?.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, City, State 12345"
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Website
        </Label>
        <Input
          id="website"
          type="url"
          value={data?.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm">Social Media</h4>

        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="w-4 h-4" />
            Twitter
          </Label>
          <Input
            id="twitter"
            value={data?.twitter || ''}
            onChange={(e) => handleChange('twitter', e.target.value)}
            placeholder="@username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </Label>
          <Input
            id="linkedin"
            value={data?.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github" className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </Label>
          <Input
            id="github"
            value={data?.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder="github.com/username"
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Relationship Context Component
function RelationshipContextStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* How Met */}
      <div className="space-y-2">
        <Label htmlFor="howMet">How Did You Meet?</Label>
        <Input
          id="howMet"
          value={data?.howMet || ''}
          onChange={(e) => handleChange('howMet', e.target.value)}
          placeholder="Conference, mutual friend, online, etc."
        />
      </div>

      {/* Importance Level */}
      <div className="space-y-2">
        <Label htmlFor="relationshipScore">Relationship Importance (1-100)</Label>
        <Input
          id="relationshipScore"
          type="number"
          min="1"
          max="100"
          value={data?.relationshipScore || 75}
          onChange={(e) => handleChange('relationshipScore', parseInt(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Higher scores indicate closer relationships
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data?.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Add any notes about this contact..."
          rows={6}
        />
      </div>
    </div>
  );
}

// Step 5: Review Component
function ReviewStep({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Review Contact Information</h3>

        {/* Basic Info */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {data?.name || 'Not provided'}</div>
            <div><strong>Email:</strong> {data?.email || 'Not provided'}</div>
            <div><strong>Phone:</strong> {data?.phone || 'Not provided'}</div>
          </div>
        </div>

        {/* Professional */}
        {(data?.company || data?.role) && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Professional</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data?.company && <div><strong>Company:</strong> {data.company}</div>}
              {data?.role && <div><strong>Role:</strong> {data.role}</div>}
            </div>
          </div>
        )}

        {/* Personal */}
        {(data?.birthday || data?.interests) && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Personal</h4>
            <div className="text-sm">
              {data?.birthday && <div><strong>Birthday:</strong> {data.birthday}</div>}
              {data?.interests && <div><strong>Interests:</strong> {data.interests}</div>}
            </div>
          </div>
        )}

        {/* Tags */}
        {data?.tags && data.tags.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {data.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {data?.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click Submit to save this contact
      </p>
    </div>
  );
}
