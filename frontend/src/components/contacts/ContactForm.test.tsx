// Last Modified: 2025-11-24 01:30
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';
import type { Contact } from '../../types';
import '@testing-library/jest-dom';

// Mock the contacts service
vi.mock('../../services/contactsService', () => ({
  contactsService: {
    createContact: vi.fn(),
    updateContact: vi.fn(),
    validatePhone: vi.fn(),
    checkDuplicate: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('../../lib/notifications/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('ContactForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockContact: Contact = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Tech Corp',
    role: 'Engineer',
    tags: ['colleague', 'friend'],
    notes: 'Test notes',
    created_at: '2025-11-24T00:00:00Z',
    updated_at: '2025-11-24T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields correctly', () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('should populate fields when editing existing contact', () => {
      render(
        <ContactForm
          contact={mockContact}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue(mockContact.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockContact.email!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockContact.phone!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockContact.company!)).toBeInTheDocument();
    });

    it('should show correct title for new vs edit mode', () => {
      const { rerender } = render(
        <ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/add new contact/i)).toBeInTheDocument();

      rerender(
        <ContactForm
          contact={mockContact}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/edit contact/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      const { contactsService } = await import('../../services/contactsService');

      (contactsService.validatePhone as any).mockReturnValue(false);

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'Test User');
      await user.type(phoneInput, '123'); // Invalid phone

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should allow form submission with only required fields', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Minimal Contact');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Minimal Contact',
          })
        );
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, '  John Doe  ');
      await user.type(emailInput, '  john@example.com  ');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
          })
        );
      });
    });
  });

  describe('Duplicate Detection', () => {
    it('should check for duplicate emails', async () => {
      const user = userEvent.setup();
      const { contactsService } = await import('../../services/contactsService');

      (contactsService.checkDuplicate as any).mockResolvedValue({
        exists: true,
        field: 'email',
        contact: { id: '2', name: 'Existing User' },
      });

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'New User');
      await user.type(emailInput, 'existing@example.com');

      // Trigger blur to check duplicate
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should check for duplicate phone numbers', async () => {
      const user = userEvent.setup();
      const { contactsService } = await import('../../services/contactsService');

      (contactsService.validatePhone as any).mockReturnValue(true);
      (contactsService.checkDuplicate as any).mockResolvedValue({
        exists: true,
        field: 'phone',
        contact: { id: '3', name: 'Phone User' },
      });

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'New User');
      await user.type(phoneInput, '+1234567890');

      // Trigger blur to check duplicate
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/phone number already exists/i)).toBeInTheDocument();
      });
    });

    it('should not check duplicates when editing same contact', async () => {
      const user = userEvent.setup();
      const { contactsService } = await import('../../services/contactsService');

      render(
        <ContactForm
          contact={mockContact}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);

      // Clear and re-type same email
      await user.clear(emailInput);
      await user.type(emailInput, mockContact.email!);

      fireEvent.blur(emailInput);

      // Should not call duplicate check for same contact's email
      await waitFor(() => {
        expect(contactsService.checkDuplicate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tag Management', () => {
    it('should add new tags', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const tagInput = screen.getByLabelText(/tags/i);

      await user.type(nameInput, 'Test User');
      await user.type(tagInput, 'friend{Enter}colleague{Enter}');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['friend', 'colleague'],
          })
        );
      });
    });

    it('should remove tags when clicking remove button', async () => {
      const user = userEvent.setup();
      render(
        <ContactForm
          contact={mockContact}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Find and click remove button for first tag
      const tagElements = screen.getAllByTestId(/tag-/i);
      const removeButton = within(tagElements[0]).getByRole('button', { name: /remove/i });

      await user.click(removeButton);

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.not.arrayContaining(['colleague']),
          })
        );
      });
    });

    it('should prevent duplicate tags', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const tagInput = screen.getByLabelText(/tags/i);

      await user.type(tagInput, 'friend{Enter}friend{Enter}');

      // Should only have one 'friend' tag
      const tagElements = screen.getAllByTestId(/tag-friend/i);
      expect(tagElements).toHaveLength(1);
    });

    it('should suggest existing tags from autocomplete', async () => {
      const user = userEvent.setup();

      // Mock autocomplete suggestions
      const mockSuggestions = ['colleague', 'friend', 'family', 'client'];

      render(
        <ContactForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          tagSuggestions={mockSuggestions}
        />
      );

      const tagInput = screen.getByLabelText(/tags/i);

      await user.type(tagInput, 'fri');

      // Should show autocomplete with matching suggestion
      await waitFor(() => {
        expect(screen.getByText('friend')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should handle successful form submission', async () => {
      const user = userEvent.setup();
      const { toast } = await import('../../lib/notifications/toast');

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'New Contact');
      await user.type(emailInput, 'new@example.com');
      await user.type(phoneInput, '+1987654321');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Contact',
          email: 'new@example.com',
          phone: '+1987654321',
          company: '',
          role: '',
          tags: [],
          notes: '',
        });
        expect(toast.success).toHaveBeenCalledWith('Contact saved successfully');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      // Mock slow submission
      mockOnSubmit.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Contact');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const { toast } = await import('../../lib/notifications/toast');

      const errorMessage = 'Failed to save contact';
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Error Contact');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();

      mockOnSubmit.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // All inputs should be disabled during submission
      expect(nameInput).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone/i)).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation dialog if form has unsaved changes', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Make changes
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Unsaved Changes');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });

      // Confirm cancel
      const confirmButton = screen.getByRole('button', { name: /discard/i });
      await user.click(confirmButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not show confirmation if no changes made', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should not show confirmation dialog
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Contact Form');
      expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/phone/i)).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/name is required/i);
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Field Interactions', () => {
    it('should format phone number automatically', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement;

      await user.type(phoneInput, '1234567890');

      // Should format to (123) 456-7890
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(phoneInput.value).toBe('(123) 456-7890');
      });
    });

    it('should capitalize name fields properly', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

      await user.type(nameInput, 'john doe');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(nameInput.value).toBe('John Doe');
      });
    });

    it('should limit notes field to maximum characters', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      const longText = 'a'.repeat(1001); // Assuming 1000 char limit

      await user.type(notesInput, longText);

      expect(notesInput.value.length).toBeLessThanOrEqual(1000);
      expect(screen.getByText(/1000\/1000/i)).toBeInTheDocument();
    });
  });
});