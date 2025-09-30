import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ShPointLogo from '../components/ShPointLogo';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  roles?: string[];
  category: string;
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: 'what-is-shpoint',
    question: 'What is ShPoint?',
    answer: 'ShPoint is a digital companion for Star Wars: Shatterpoint tabletop game. It helps you manage characters, build strike teams, track games, and connect with other players.',
    category: 'General',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'how-to-register',
    question: 'How do I create an account?',
    answer: 'ShPoint uses an invitation system. You need to request access using the form on the homepage. Only Gmail addresses are accepted. After your request is approved, you\'ll receive an invitation email to create your account.',
    category: 'General',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'request-access',
    question: 'How do I request access to ShPoint?',
    answer: 'Use the "Request Access to ShPoint" form on the homepage. Fill in your Gmail address, optional name and message. We don\'t know when your request will be approved, but you\'ll receive an email notification once it\'s reviewed.',
    category: 'General',
    roles: ['GUEST']
  },
  {
    id: 'gmail-requirement',
    question: 'Why do I need a Gmail address?',
    answer: 'ShPoint uses Google OAuth for secure authentication. This ensures your account is protected and we can verify your identity. Only Gmail addresses are accepted for access requests.',
    category: 'General',
    roles: ['GUEST']
  },
  {
    id: 'what-can-i-see',
    question: 'What can I see without an account?',
    answer: 'As a guest, you can view the homepage, read news and updates, and request access. You cannot view characters, build strike teams, or access game features until your access request is approved.',
    category: 'General',
    roles: ['GUEST']
  },
  {
    id: 'forgot-password',
    question: 'I forgot my password. What should I do?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a reset link.',
    category: 'General',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Character Management
  {
    id: 'view-characters',
    question: 'How do I view characters?',
    answer: 'Go to the "Characters" page from the main menu. You can browse all available characters, filter by faction or unit type, and click on any character to see detailed information.',
    category: 'Characters',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'character-details',
    question: 'What information can I see about a character?',
    answer: 'Each character shows their stats (stamina, durability, force, hanker), abilities, stance trees, faction, unit type, and squad points. You can also see their portrait and any special tags.',
    category: 'Characters',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'edit-characters',
    question: 'How do I edit characters?',
    answer: 'Only Editors and Admins can edit characters. Open a character\'s details and click the "Edit Character" button. You can modify stats, abilities, stance trees, and other properties.',
    category: 'Characters',
    roles: ['EDITOR', 'ADMIN']
  },
  {
    id: 'add-new-character',
    question: 'How do I add a new character?',
    answer: 'Go to the Characters page and click "Add New Character". Fill in the character\'s basic information, stats, abilities, and stance tree. Only Editors and Admins can add new characters.',
    category: 'Characters',
    roles: ['EDITOR', 'ADMIN']
  },

  // Strike Teams
  {
    id: 'build-strike-team',
    question: 'How do I build a strike team?',
    answer: 'Go to "Squad Builder" from the main menu. Drag characters from the catalog to your squads. Make sure your team follows the rules (correct squad points, valid combinations). Click "Save Strike Team" when done.',
    category: 'Strike Teams',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'strike-team-rules',
    question: 'What are the rules for building strike teams?',
    answer: 'Your strike team must have exactly 8 squad points. You need at least one Primary character. Secondary and Support characters are optional. All characters must be from the same era or compatible eras.',
    category: 'Strike Teams',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'save-strike-team',
    question: 'How do I save my strike team?',
    answer: 'In the Squad Builder, give your team a name and description. Choose whether it\'s a real team or a dream team. Click "Save Strike Team" to store it in your collection.',
    category: 'Strike Teams',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'vs-mode',
    question: 'What is VS Mode?',
    answer: 'VS Mode lets you compare two strike teams and log game results. Enable it in Squad Builder to access game logging features and track your matches.',
    category: 'Strike Teams',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Game Logging
  {
    id: 'log-game-result',
    question: 'How do I log a game result?',
    answer: 'In Squad Builder, enable VS Mode and click "Log Game Result". Fill in the players, winner, mission, and other details. You can also log detailed dice rolls and character performance.',
    category: 'Game Logging',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'view-game-history',
    question: 'How do I view my game history?',
    answer: 'Go to your profile and click "My Games". You can see all your past games, filter by results or mode, and expand any game to see detailed information including dice rolls and character performance.',
    category: 'Game Logging',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'export-game-data',
    question: 'Can I export my game data?',
    answer: 'Yes! In your game history, click "Export JSON" or "Export CSV" to download your game data. This includes all dice rolls, character states, struggle cards, and other game details.',
    category: 'Game Logging',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'log-dice-rolls',
    question: 'How do I log dice rolls?',
    answer: 'Use the Game Logger (available in VS Mode) to record dice rolls. Select the character, dice type, number of dice, and results. You can also log node activations from stance trees.',
    category: 'Game Logging',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Challenges and Social
  {
    id: 'challenge-player',
    question: 'How do I challenge another player?',
    answer: 'Go to the "Play" section and find available players. Click "Challenge" to send a challenge request. Specify your skill level, preferred missions, and any other details.',
    category: 'Social',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'respond-challenge',
    question: 'How do I respond to a challenge?',
    answer: 'Check your Inbox for challenge notifications. You can accept, decline, or negotiate the terms. Once accepted, you can schedule the game and set up reminders.',
    category: 'Social',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'schedule-game',
    question: 'How do I schedule a game?',
    answer: 'After accepting a challenge, you can schedule the game by setting the date, time, and location. Both players can add calendar reminders and export to their preferred calendar app.',
    category: 'Social',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'inbox-messages',
    question: 'What is the Inbox for?',
    answer: 'Your Inbox contains notifications about challenges, game invitations, system messages, and other updates. You can mark messages as read, delete them, or respond to challenges directly.',
    category: 'Social',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Comments and Community
  {
    id: 'comment-on-content',
    question: 'Can I comment on characters or strike teams?',
    answer: 'Yes! You can comment on characters, strike teams, sets, and missions. Click the comment section to add your thoughts, ask questions, or share strategies with other players.',
    category: 'Community',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'like-comments',
    question: 'How do I like or reply to comments?',
    answer: 'Click the heart icon to like a comment, or click "Reply" to respond to someone\'s comment. You can have conversations and share tips with the community.',
    category: 'Community',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Missions and Sets
  {
    id: 'view-missions',
    question: 'How do I view missions?',
    answer: 'Go to the "Missions" page to see all available missions. Each mission shows the map layout, objectives, struggle cards, and other details you need to play.',
    category: 'Missions',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'view-sets',
    question: 'How do I view sets and expansions?',
    answer: 'Visit the "Sets" page to see all available sets, expansions, and accessories. You can see what characters and missions come in each set.',
    category: 'Sets',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },

  // Admin and Editor Features
  {
    id: 'admin-panel',
    question: 'What can I do in the Admin Panel?',
    answer: 'Admins can manage users, view audit logs, manage API tokens, and access advanced settings. You can also moderate content and manage the overall system.',
    category: 'Administration',
    roles: ['ADMIN']
  },
  {
    id: 'editor-features',
    question: 'What can Editors do?',
    answer: 'Editors can create and edit characters, missions, and sets. You can also moderate comments and help maintain the content quality of the platform.',
    category: 'Administration',
    roles: ['EDITOR', 'ADMIN']
  },
  {
    id: 'user-management',
    question: 'How do I manage users?',
    answer: 'Admins can view all users, change their roles, suspend accounts, and manage invitations. Go to the Admin Panel and select "User Management".',
    category: 'Administration',
    roles: ['ADMIN']
  },

  // Technical Issues
  {
    id: 'browser-compatibility',
    question: 'Which browsers are supported?',
    answer: 'ShPoint works best with modern browsers like Chrome, Firefox, Safari, and Edge. Make sure your browser is up to date for the best experience.',
    category: 'Technical',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'mobile-support',
    question: 'Can I use ShPoint on my phone?',
    answer: 'Yes! ShPoint is mobile-friendly and works on smartphones and tablets. Some features like detailed editing are easier on desktop, but you can view content and log games on mobile.',
    category: 'Technical',
    roles: ['USER', 'EDITOR', 'ADMIN']
  },
  {
    id: 'data-backup',
    question: 'Is my data safe?',
    answer: 'Yes, your data is stored securely in our database. You can export your game data anytime, and we regularly backup all information.',
    category: 'Technical',
    roles: ['USER', 'EDITOR', 'ADMIN']
  }
];

export default function FAQPage() {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const userRole = me?.role || 'GUEST';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];

  // Filter FAQ items based on user role, category, and search term
  const filteredFAQ = faqData.filter(item => {
    const roleMatch = !item.roles || item.roles.includes(userRole);
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const searchMatch = !searchTerm || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return roleMatch && categoryMatch && searchMatch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ marginBottom: '16px' }}>
          <ShPointLogo size={60} showText={true} />
        </div>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Frequently Asked Questions</h1>
      </div>
      
      {/* Welcome message based on role */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
          Welcome, {userRole === 'ADMIN' ? 'Administrator' : userRole === 'EDITOR' ? 'Editor' : 'Player'}!
        </h3>
        <p style={{ margin: 0, color: '#1976d2' }}>
          {userRole === 'ADMIN' 
            ? 'You have full access to all features including user management and system administration.'
            : userRole === 'EDITOR' 
            ? 'You can create and edit content, moderate comments, and help maintain the platform.'
            : 'You can build strike teams, log games, challenge other players, and participate in the community.'
          }
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '20px', color: '#6c757d', fontSize: '14px' }}>
        Showing {filteredFAQ.length} of {faqData.filter(item => !item.roles || item.roles.includes(userRole)).length} questions
      </div>

      {/* FAQ Items */}
      {filteredFAQ.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>No questions found</h3>
          <p>Try adjusting your search terms or category filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredFAQ.map((item, index) => (
            <FAQItem key={item.id} item={item} index={index} />
          ))}
        </div>
      )}

      {/* Contact Information */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Still have questions?</h3>
        <p style={{ margin: '0 0 16px 0', color: '#6c757d' }}>
          Can't find what you're looking for? We're here to help!
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open('mailto:support@shpoint.com', '_blank')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📧 Contact Support
          </button>
          <button
            onClick={() => window.open('https://discord.gg/shatterpoint', '_blank')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#7289da',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💬 Join Discord
          </button>
        </div>
      </div>
    </div>
  );
}

interface FAQItemProps {
  item: FAQItem;
  index: number;
}

function FAQItem({ item, index }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#f8f9fa' : 'white',
          borderBottom: isExpanded ? '1px solid #e9ecef' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.2s ease'
        }}
      >
        <div>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '4px',
            color: '#495057'
          }}>
            {index + 1}. {item.question}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d',
            backgroundColor: '#e9ecef',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {item.category}
          </div>
        </div>
        <div style={{ 
          fontSize: '18px', 
          color: '#6c757d',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ 
          padding: '16px',
          backgroundColor: '#f8f9fa',
          lineHeight: '1.6',
          color: '#495057'
        }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}
