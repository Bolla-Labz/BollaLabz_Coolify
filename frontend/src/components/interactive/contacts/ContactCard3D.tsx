// Last Modified: 2025-11-24 10:03
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Phone,
  Mail,
  MessageCircle,
  Video,
  Calendar,
  Star,
  MoreVertical,
  Linkedin,
  Twitter,
  Github,
  Globe,
  MapPin,
  Building,
  Clock,
  TrendingUp,
  UserPlus,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactCard3DProps {
  contact: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    social?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
    tags?: string[];
    relationshipScore?: number;
    lastInteraction?: Date;
    nextFollowUp?: Date;
    location?: string;
    status?: 'online' | 'offline' | 'busy' | 'away';
    bio?: string;
    metrics?: {
      interactions: number;
      responseTime: string;
      engagementRate: number;
    };
  };

  // View modes
  view?: 'card' | 'compact' | 'expanded' | '3d-flip' | '3d-rotate';

  // Features
  features?: {
    flip?: boolean;
    quickActions?: boolean;
    statusIndicator?: boolean;
    activityPreview?: boolean;
    socialLinks?: boolean;
    aiInsights?: boolean;
    voiceCall?: boolean;
    videoCall?: boolean;
    editMode?: boolean;
  };

  // Actions
  actions?: Array<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
    badge?: string | number;
  }>;

  // Callbacks
  onFlip?: (isFlipped: boolean) => void;
  onEdit?: () => void;
  onCall?: (type: 'voice' | 'video') => void;

  // Styling
  gradient?: boolean;
  glassmorphism?: boolean;
  neon?: boolean;
  className?: string;
}

// Animation variants
const cardVariants: Variants = {
  initial: { rotateY: 0 },
  flipped: { rotateY: 180 },
  hover: { scale: 1.05, z: 50 },
  tap: { scale: 0.98 }
};

const glowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0 rgba(var(--primary-rgb), 0)'
  },
  animate: {
    boxShadow: [
      '0 0 20px rgba(var(--primary-rgb), 0.3)',
      '0 0 40px rgba(var(--primary-rgb), 0.5)',
      '0 0 20px rgba(var(--primary-rgb), 0.3)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity
    }
  }
};

// Status indicator component
const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  return (
    <div className="relative">
      <div className={cn(
        'w-3 h-3 rounded-full',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-400'
      )}>
        {status === 'online' && (
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
        )}
      </div>
    </div>
  );
};

// Relationship score visualization
const RelationshipScore: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', {
            'bg-green-500': score >= 80,
            'bg-blue-500': score >= 60 && score < 80,
            'bg-yellow-500': score >= 40 && score < 60,
            'bg-red-500': score < 40
          })}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <span className={cn('text-sm font-semibold', getColor())}>{score}%</span>
    </div>
  );
};

export const ContactCard3D: React.FC<ContactCard3DProps> = ({
  contact,
  view = '3d-flip',
  features = {
    flip: true,
    quickActions: true,
    statusIndicator: true,
    activityPreview: true,
    socialLinks: true,
    aiInsights: false,
    voiceCall: true,
    videoCall: true,
    editMode: false
  },
  actions = [],
  onFlip,
  onEdit,
  onCall,
  gradient = false,
  glassmorphism = true,
  neon = false,
  className
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle 3D tilt effect on mouse move
  useEffect(() => {
    if (view !== '3d-rotate' || !isHovered) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setMousePosition({
        x: (x - 0.5) * 20, // Max 20 degree rotation
        y: (y - 0.5) * -20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered, view]);

  // Handle card flip
  const handleFlip = () => {
    if (!features.flip) return;
    setIsFlipped(!isFlipped);
    onFlip?.(!isFlipped);
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  // Base card styles
  const cardStyles = cn(
    'relative w-full max-w-sm rounded-xl transition-all duration-300',
    '@container',
    {
      'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-[1px]': gradient,
      'bg-white/10 backdrop-blur-md border border-white/20': glassmorphism,
      'shadow-neon': neon
    },
    className
  );

  // Render card front
  const renderCardFront = () => (
    <div className={cn(
      "h-full bg-white dark:bg-gray-900 rounded-xl",
      "@sm:p-3 @md:p-4 @lg:p-6"
    )}>
      {/* Header */}
      <div className={cn("flex items-start justify-between", "@sm:mb-2 @md:mb-4")}>
        <div className={cn("flex items-center", "@sm:gap-2 @md:gap-3")}>
          <div className="relative">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={contact.name}
                className={cn(
                  "rounded-full object-cover",
                  "@sm:w-12 @sm:h-12 @md:w-14 @md:h-14 @lg:w-16 @lg:h-16"
                )}
              />
            ) : (
              <div className={cn(
                "rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold",
                "@sm:w-12 @sm:h-12 @sm:text-base @md:w-14 @md:h-14 @md:text-lg @lg:w-16 @lg:h-16 @lg:text-xl"
              )}>
                {contact.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            {features.statusIndicator && contact.status && (
              <div className="absolute bottom-0 right-0">
                <StatusIndicator status={contact.status} />
              </div>
            )}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold text-gray-900 dark:text-white",
              "@sm:text-sm @md:text-base @lg:text-lg"
            )}>
              {contact.name}
            </h3>
            {contact.role && (
              <p className={cn(
                "text-gray-600 dark:text-gray-400",
                "@sm:text-xs @md:text-sm"
              )}>{contact.role}</p>
            )}
            {contact.company && (
              <p className={cn(
                "text-gray-500 dark:text-gray-500 flex items-center gap-1",
                "@sm:hidden @md:flex @md:text-xs"
              )}>
                <Building className="h-3 w-3" />
                {contact.company}
              </p>
            )}
          </div>
        </div>

        {features.editMode && (
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>{contact.location}</span>
          </div>
        )}
      </div>

      {/* Relationship score */}
      {contact.relationshipScore !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Relationship</span>
            <TrendingUp className="h-3 w-3 text-gray-400" />
          </div>
          <RelationshipScore score={contact.relationshipScore} />
        </div>
      )}

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {contact.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Activity preview */}
      {features.activityPreview && (
        <div className="border-t dark:border-gray-800 pt-3 mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            {contact.lastInteraction && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last: {formatDate(contact.lastInteraction)}</span>
              </div>
            )}
            {contact.nextFollowUp && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Follow up: {formatDate(contact.nextFollowUp)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      {features.quickActions && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {features.voiceCall && (
              <motion.button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onCall?.('voice')}
              >
                <Phone className="h-4 w-4" />
              </motion.button>
            )}
            {features.videoCall && (
              <motion.button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onCall?.('video')}
              >
                <Video className="h-4 w-4" />
              </motion.button>
            )}
            <motion.button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Social links */}
          {features.socialLinks && contact.social && (
            <div className="flex gap-1">
              {contact.social.linkedin && (
                <a
                  href={contact.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {contact.social.twitter && (
                <a
                  href={contact.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {contact.social.github && (
                <a
                  href={contact.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render card back
  const renderCardBack = () => (
    <div className="h-full p-6 bg-white dark:bg-gray-900 rounded-xl" style={{ transform: 'rotateY(180deg)' }}>
      <h3 className="text-lg font-semibold mb-4">Details & Insights</h3>

      {/* Bio */}
      {contact.bio && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.bio}</p>
        </div>
      )}

      {/* Metrics */}
      {contact.metrics && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{contact.metrics.interactions}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{contact.metrics.responseTime}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{contact.metrics.engagementRate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Engagement</div>
          </div>
        </div>
      )}

      {/* Custom actions */}
      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map(action => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                style={action.color ? { backgroundColor: `${action.color}20` } : {}}
              >
                <div className="flex items-center gap-2">
                  <ActionIcon className="h-4 w-4" style={{ color: action.color }} />
                  <span className="text-sm">{action.label}</span>
                </div>
                {action.badge && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    {action.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Flip back button */}
      <button
        onClick={handleFlip}
        className="mt-4 w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Back to Profile
      </button>
    </div>
  );

  // 3D flip view
  if (view === '3d-flip') {
    return (
      <div className="perspective-1000">
        <motion.div
          ref={cardRef}
          className={cn(cardStyles, 'cursor-pointer preserve-3d')}
          style={{ minHeight: '400px' }}
          variants={cardVariants}
          initial="initial"
          animate={isFlipped ? 'flipped' : 'initial'}
          whileHover="hover"
          whileTap="tap"
          onClick={handleFlip}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 backface-hidden">
            {renderCardFront()}
          </div>
          <div className="absolute inset-0 backface-hidden">
            {renderCardBack()}
          </div>
        </motion.div>
      </div>
    );
  }

  // 3D rotate view (parallax tilt)
  if (view === '3d-rotate') {
    return (
      <div className="perspective-1000">
        <motion.div
          ref={cardRef}
          className={cardStyles}
          style={{
            rotateX: mousePosition.y,
            rotateY: mousePosition.x,
            transformStyle: 'preserve-3d'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setMousePosition({ x: 0, y: 0 });
          }}
          animate={neon ? 'animate' : 'initial'}
          variants={glowVariants}
        >
          {renderCardFront()}
        </motion.div>
      </div>
    );
  }

  // Default card view
  return (
    <motion.div
      className={cardStyles}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {renderCardFront()}
    </motion.div>
  );
};

ContactCard3D.displayName = 'ContactCard3D';