import { User, Item, Task, Tag, Stage, Comment, ActivityLog } from '../types/database';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'legal_platform_users',
  ITEMS: 'legal_platform_items',
  TASKS: 'legal_platform_tasks',
  TAGS: 'legal_platform_tags',
  STAGES: 'legal_platform_stages',
  COMMENTS: 'legal_platform_comments',
  ACTIVITY_LOGS: 'legal_platform_activity_logs',
  CURRENT_USER: 'legal_platform_current_user',
  INITIALIZED: 'legal_platform_initialized',
  SYSTEM_CONFIG: 'legal_platform_system_config'
};

// Helper functions for localStorage operations
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Initialize default data
export const initializeDefaultData = () => {
  // No longer initializing default data - using Supabase exclusively
  console.log('localStorage initialization disabled - using Supabase for data storage');
  return;
};

// User management
export const localAuth = {
  signIn: async (email: string, password: string) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === email && u.active);
    
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Simple password check (in real app, this would be hashed)
    if (email === 'admin@example.com' && password === 'admin123') {
      setToStorage(STORAGE_KEYS.CURRENT_USER, user);
      return { user };
    }

    return { error: 'Invalid email or password' };
  },

  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: () => {
    return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  updatePassword: async (newPassword: string) => {
    const currentUser = localAuth.getCurrentUser();
    if (!currentUser) {
      return { error: 'No user logged in' };
    }

    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const updatedUsers = users.map(u => 
      u.id === currentUser.id 
        ? { ...u, force_password_change: false, updated_at: new Date().toISOString() }
        : u
    );
    
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);
    
    const updatedUser = { ...currentUser, force_password_change: false };
    setToStorage(STORAGE_KEYS.CURRENT_USER, updatedUser);
    
    return {};
  }
};

// Data operations
export const localDB = {
  // Users
  getUsers: () => getFromStorage<User[]>(STORAGE_KEYS.USERS, []),
  
  updateUser: (userId: string, updates: Partial<User>) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, ...updates, updated_at: new Date().toISOString() }
        : u
    );
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);
    return updatedUsers.find(u => u.id === userId);
  },

  createUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    users.push(newUser);
    setToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // System Configuration
  getSystemConfig: (): SystemConfig => getFromStorage<SystemConfig>(STORAGE_KEYS.SYSTEM_CONFIG, {
    legalDepartments: ['DOJ', 'SEC', 'Bankruptcy', 'State-level'],
    dealBusinessNatures: ['Land Sales', 'Development', 'Multifamily', 'Single Family', 'Commercial'],
    realEstateBusinessNatures: ['Land Sales', 'Development', 'Multifamily', 'Single Family', 'Commercial'],
    cityApprovals: ['HUD', 'MUD', 'Planning Commission', 'City Council', 'Building Permits']
  }),

  setSystemConfig: (config: SystemConfig) => {
    setToStorage(STORAGE_KEYS.SYSTEM_CONFIG, config);
  },

  // Items
  getItems: (sectionId?: string) => {
    const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const tags = getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
    
    const itemsWithRelations = items.map(item => ({
      ...item,
      assignees: item.assignee_ids ? users.filter(u => item.assignee_ids.includes(u.id)) : [],
      tags: item.tag_ids ? tags.filter(t => item.tag_ids.includes(t.id)) : []
    }));
    
    return sectionId ? itemsWithRelations.filter(i => i.section_id === sectionId) : itemsWithRelations;
  },

  createItem: (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
    const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    const newItem: Item = {
      ...itemData,
      assignee_ids: itemData.assignee_ids || [],
      tag_ids: itemData.tag_ids || [],
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    items.push(newItem);
    setToStorage(STORAGE_KEYS.ITEMS, items);
    return newItem;
  },

  updateItem: (itemId: string, updates: Partial<Item>) => {
    const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    console.log('=== UPDATE ITEM DEBUG ===');
    console.log('Item ID to update:', itemId);
    console.log('Updates to apply:', updates);
    console.log('Current items in storage:', items.length);
    
    const existingItem = items.find(i => i.id === itemId);
    
    if (!existingItem) {
      console.error('CRITICAL: Item not found for update!');
      console.error('Looking for ID:', itemId);
      console.error('Available items:', items.map(i => ({ id: i.id, title: i.title })));
      return undefined;
    }
    
    console.log('Found existing item:', existingItem.title);
    
    // Create updated item with explicit field preservation
    const updatedItem: Item = Object.assign({}, existingItem, updates, {
      id: existingItem.id, // Never change ID
      created_at: existingItem.created_at, // Never change creation date
      created_by: existingItem.created_by, // Never change creator
      updated_at: new Date().toISOString() // Always update timestamp
    });
    
    console.log('Updated item created:', updatedItem.title);
    
    // Create new array with updated item
    const updatedItems = items.map(i => 
      i.id === itemId ? updatedItem : i
    );
    
    console.log('BEFORE SAVE - Items count:', items.length);
    console.log('AFTER UPDATE - Items count:', updatedItems.length);
    console.log('Legal items before:', items.filter(i => i.section_id === 'legal').length);
    console.log('Legal items after:', updatedItems.filter(i => i.section_id === 'legal').length);
    
    // Verify the updated item exists in the new array
    const verifyItem = updatedItems.find(i => i.id === itemId);
    if (!verifyItem) {
      console.error('CRITICAL ERROR: Updated item not found in new array!');
      return existingItem; // Return original item if update failed
    }
    
    console.log('Verified updated item exists:', verifyItem.title);
    
    // Save to localStorage
    setToStorage(STORAGE_KEYS.ITEMS, updatedItems);
    
    // Verify it was saved correctly
    const savedItems = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    const savedItem = savedItems.find(i => i.id === itemId);
    
    if (!savedItem) {
      console.error('CRITICAL ERROR: Item not found after saving to localStorage!');
      console.error('Items in storage after save:', savedItems.length);
      return existingItem;
    }
    
    console.log('SUCCESS: Item saved and verified in localStorage');
    console.log('=== END UPDATE ITEM DEBUG ===');
    return updatedItem;
  },

  deleteItem: (itemId: string) => {
    const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    const filteredItems = items.filter(i => i.id !== itemId);
    setToStorage(STORAGE_KEYS.ITEMS, filteredItems);
    
    // Also delete related tasks
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const filteredTasks = tasks.filter(t => t.item_id !== itemId);
    setToStorage(STORAGE_KEYS.TASKS, filteredTasks);
  },

  // Tasks
  getTasks: (itemId?: string) => {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const tags = getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
    
    const tasksWithRelations = tasks.map(task => ({
      ...task,
      assignees: task.assignee_ids ? users.filter(u => task.assignee_ids.includes(u.id)) : [],
      tags: task.tag_ids ? tags.filter(t => task.tag_ids.includes(t.id)) : []
    }));
    
    return itemId ? tasksWithRelations.filter(t => t.item_id === itemId) : tasksWithRelations;
  },

  createTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const newTask: Task = {
      ...taskData,
      assignee_ids: taskData.assignee_ids || [],
      tag_ids: taskData.tag_ids || [],
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    tasks.push(newTask);
    setToStorage(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const tags = getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
    
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, ...updates, updated_at: new Date().toISOString() }
        : t
    );
    setToStorage(STORAGE_KEYS.TASKS, updatedTasks);
    
    const updatedTask = updatedTasks.find(t => t.id === taskId);
    if (updatedTask) {
      // Add assignees and tags relationships
      updatedTask.assignees = updatedTask.assignee_ids ? users.filter(u => updatedTask.assignee_ids.includes(u.id)) : [];
      updatedTask.tags = updatedTask.tag_ids ? tags.filter(t => updatedTask.tag_ids.includes(t.id)) : [];
    }
    
    return updatedTask;
  },

  deleteTask: (taskId: string) => {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    setToStorage(STORAGE_KEYS.TASKS, filteredTasks);
  },

  // Tags
  getTags: () => getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, []),

  // Stages
  getStages: () => getFromStorage<Stage[]>(STORAGE_KEYS.STAGES, []),

  // Comments
  getComments: (parentType: string, parentId: string) => {
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    return comments.filter(c => c.parent_type === parentType && c.parent_id === parentId);
  },

  createComment: (commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) => {
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const newComment: Comment = {
      ...commentData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    comments.push(newComment);
    setToStorage(STORAGE_KEYS.COMMENTS, comments);
    return newComment;
  },

  // Activity logs
  logActivity: (activityData: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const logs = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    const newLog: ActivityLog = {
      ...activityData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    setToStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    return newLog;
  },

  getActivityLogs: (targetType: string, targetId: string) => {
    const logs = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    return logs.filter(l => l.target_type === targetType && l.target_id === targetId);
  }
};
