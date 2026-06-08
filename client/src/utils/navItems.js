import { Bookmark, Compass, PlusCircle, User } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', icon: Compass, label: 'Discover', end: true },
  { to: '/add', icon: PlusCircle, label: 'Add Gem', end: false },
  { to: '/saved', icon: Bookmark, label: 'Saved', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
];