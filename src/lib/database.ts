import { supabase } from './supabase';
import { getCurrentUser } from '../hooks/useAuth';

// Direct Supabase database operations - no localStorage fallbacks
export const db = {
  // Get user by ID
  async getUserById(userId: string) {
    console.log('🔍 Fetching user by ID from Supabase...', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching user by ID:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched user by ID from Supabase');
    return data;
  },

  // Users
  async getUsers() {
    console.log('🔍 Fetching users from Supabase...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase error fetching users:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched users from Supabase:', data?.length || 0);
    return data || [];
  },

  async createUser(userData: any) {
    console.log('➕ Creating user in Supabase...');
    
    // Create user profile directly with generated UUID
    const userProfileData = {
      ...userData,
      id: crypto.randomUUID()
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(userProfileData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error creating user:', error);
      throw error;
    }
    
    console.log('✅ Successfully created user in Supabase');
    return data;
  },

  async updateUser(userId: string, updates: any) {
    console.log('📝 Updating user in Supabase...');
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error updating user:', error);
      throw error;
    }
    
    console.log('✅ Successfully updated user in Supabase');
    return data;
  },

  // Items
  async getItems(sectionId?: string) {
    console.log('🔍 Fetching items from Supabase...', sectionId ? `for section: ${sectionId}` : 'all sections');
    
    // Ensure sections exist before querying items
    await this.ensureSectionsExist();
    
    let query = supabase
      .from('items')
      .select(`
        *,
        assignees:item_assignees(
          user:users(*)
        ),
        tags:item_tags(
          tag:tags(*)
        ),
        legal_meta(*),
        deal_meta(*),
        real_estate_meta(*)
      `)
      .order('created_at', { ascending: false });
    
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Supabase error fetching items:', error);
      throw error;
    }
    
    // Transform the data to match our expected format
    const transformedData = data?.map(item => ({
      ...item,
      assignees: item.assignees?.map((a: any) => a.user) || [],
      tags: item.tags?.map((t: any) => t.tag) || [],
      assignee_ids: item.assignees?.map((a: any) => a.user.id) || [],
      tag_ids: item.tags?.map((t: any) => t.tag.id) || []
    })) || [];
    
    console.log('✅ Successfully fetched items from Supabase:', transformedData.length);
    return transformedData;
  },

  async createItem(itemData: any) {
    console.log('➕ Creating item in Supabase...');
    
    // Ensure sections exist before creating item
    await this.ensureSectionsExist();
    
    const currentUser = getCurrentUser();
    
    // Extract assignee_ids and tag_ids before creating item
    const { assignee_ids, tag_ids, ...itemDataWithoutIds } = itemData;
    
    // Ensure we have valid data structure
    const validItemData = {
      section_id: itemDataWithoutIds.section_id,
      title: itemDataWithoutIds.title,
      description: itemDataWithoutIds.description,
      status: itemDataWithoutIds.status || 'active',
      priority: itemDataWithoutIds.priority || 'normal',
      start_date: itemDataWithoutIds.start_date,
      due_date: itemDataWithoutIds.due_date,
      external_links: itemDataWithoutIds.external_links || [],
      attachments: itemDataWithoutIds.attachments || [],
      custom_fields: itemDataWithoutIds.custom_fields || {},
      created_by: currentUser?.id || null,
      updated_by: currentUser?.id || null
    };

    // First create the item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert(validItemData)
      .select()
      .single();
    
    if (itemError) {
      console.error('❌ Supabase error creating item:', itemError);
      throw itemError;
    }
    
    // Handle assignees if provided
    if (assignee_ids && assignee_ids.length > 0) {
      const assigneeInserts = assignee_ids.map((userId: string) => ({
        item_id: item.id,
        user_id: userId
      }));
      
      const { error: assigneeError } = await supabase
        .from('item_assignees')
        .insert(assigneeInserts);
        
      if (assigneeError) {
        console.warn('⚠️ Error adding assignees:', assigneeError);
      }
    }
    
    // Handle tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tagId: string) => ({
        item_id: item.id,
        tag_id: tagId
      }));
      
      const { error: tagError } = await supabase
        .from('item_tags')
        .insert(tagInserts);
        
      if (tagError) {
        console.warn('⚠️ Error adding tags:', tagError);
      }
    }
    
    console.log('✅ Successfully created item in Supabase');
    return item;
  },

  // Section-specific metadata methods
  async saveLegalMeta(legalMeta: any) {
    console.log('💾 Saving legal metadata to Supabase...');
    
    const { data, error } = await supabase
      .from('legal_meta')
      .upsert(legalMeta)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error saving legal metadata:', error);
      throw error;
    }
    
    console.log('✅ Successfully saved legal metadata to Supabase');
    return data;
  },

  async saveDealMeta(dealMeta: any) {
    console.log('💾 Saving deal metadata to Supabase...');
    
    const { data, error } = await supabase
      .from('deal_meta')
      .upsert(dealMeta)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error saving deal metadata:', error);
      throw error;
    }
    
    console.log('✅ Successfully saved deal metadata to Supabase');
    return data;
  },

  async saveRealEstateMeta(realEstateMeta: any) {
    console.log('💾 Saving real estate metadata to Supabase...');
    
    const { data, error } = await supabase
      .from('real_estate_meta')
      .upsert(realEstateMeta)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error saving real estate metadata:', error);
      throw error;
    }
    
    console.log('✅ Successfully saved real estate metadata to Supabase');
    return data;
  },
  async updateItem(itemId: string, updates: any) {
    console.log('📝 Updating item in Supabase...');
    
    // Ensure sections exist before updating item
    await this.ensureSectionsExist();
    
    const currentUser = getCurrentUser();
    
    // Extract assignee_ids and tag_ids before updating item
    const { assignee_ids, tag_ids, ...updatesWithoutIds } = updates;
    
    const updatesWithUser = {
      ...updatesWithoutIds,
      updated_by: currentUser?.id || null
    };
    
    const { data, error } = await supabase
      .from('items')
      .update(updatesWithUser)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error updating item:', error);
      throw error;
    }
    
    // Handle assignees update
    if (assignee_ids !== undefined) {
      // First, delete existing assignees
      await supabase
        .from('item_assignees')
        .delete()
        .eq('item_id', itemId);
      
      // Then, insert new assignees if any
      if (assignee_ids.length > 0) {
        const assigneeInserts = assignee_ids.map((userId: string) => ({
          item_id: itemId,
          user_id: userId
        }));
        
        const { error: assigneeError } = await supabase
          .from('item_assignees')
          .insert(assigneeInserts);
          
        if (assigneeError) {
          console.warn('⚠️ Error updating assignees:', assigneeError);
        }
      }
    }
    
    // Handle tags update
    if (tag_ids !== undefined) {
      // First, delete existing tags
      await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', itemId);
      
      // Then, insert new tags if any
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tagId: string) => ({
          item_id: itemId,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('item_tags')
          .insert(tagInserts);
          
        if (tagError) {
          console.warn('⚠️ Error updating tags:', tagError);
        }
      }
    }
    
    console.log('✅ Successfully updated item in Supabase');
    return data;
  },

  async deleteItem(itemId: string) {
    console.log('🗑️ Deleting item from Supabase...');
    
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('❌ Supabase error deleting item:', error);
      throw error;
    }
    
    console.log('✅ Successfully deleted item from Supabase');
    return true;
  },

  // Tasks
  async getTasks(itemId?: string) {
    console.log('🔍 Fetching tasks from Supabase...', itemId ? `for item: ${itemId}` : 'all tasks');
    
    // Check Supabase configuration first
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing. Please check your .env file.');
    }

    try {
      // Test connection first
      const { error: connectionError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Supabase connection test failed:', connectionError);
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to database. Please check your internet connection and Supabase configuration.');
      }
      throw error;
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignees:task_assignees(
          user:users(*)
        ),
        tags:task_tags(
          tag:tags(*)
        ),
        item:items(*)
      `)
      .order('created_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    // Get all parent task IDs
    const parentTaskIds = [...new Set(data?.filter(t => t.parent_task_id).map(t => t.parent_task_id))];

    // Fetch parent tasks separately
    let parentTasks: any[] = [];
    if (parentTaskIds.length > 0) {
      const { data: parents, error: parentError } = await supabase
        .from('tasks')
        .select('id, title, task_level, stage, parent_task_id')
        .in('id', parentTaskIds);

      if (!parentError && parents) {
        parentTasks = parents;
      }
    }

    // Get grandparent task IDs (for level 2 tasks)
    const grandparentTaskIds = [...new Set(parentTasks.filter(p => p.parent_task_id).map(p => p.parent_task_id))];

    let grandparentTasks: any[] = [];
    if (grandparentTaskIds.length > 0) {
      const { data: grandparents, error: grandparentError } = await supabase
        .from('tasks')
        .select('id, title, task_level, stage')
        .in('id', grandparentTaskIds);

      if (!grandparentError && grandparents) {
        grandparentTasks = grandparents;
      }
    }

    // Create maps for quick lookup
    const parentMap = new Map(parentTasks.map(p => [p.id, p]));
    const grandparentMap = new Map(grandparentTasks.map(g => [g.id, g]));

    // Attach grandparents to parents
    parentTasks.forEach(parent => {
      if (parent.parent_task_id) {
        parent.parent = grandparentMap.get(parent.parent_task_id) || null;
      }
    });

    // Transform the data to match our expected format
    const transformedData = data?.map(task => ({
      ...task,
      assignees: task.assignees?.map((a: any) => a.user) || [],
      tags: task.tags?.map((t: any) => t.tag) || [],
      assignee_ids: task.assignees?.map((a: any) => a.user.id) || [],
      tag_ids: task.tags?.map((t: any) => t.tag.id) || [],
      parent: task.parent_task_id ? parentMap.get(task.parent_task_id) || null : null
    })) || [];

    console.log('✅ Successfully fetched tasks from Supabase:', transformedData.length);
    console.log('✅ Attached parent data to', transformedData.filter(t => t.parent).length, 'subtasks');
    return transformedData;
  },

  async createTask(taskData: any) {
    console.log('➕ Creating task in Supabase...');
    
    const currentUser = getCurrentUser();
    
    // Get the first stage as default if no stage is provided
    let defaultStage = taskData.stage;
    if (!defaultStage) {
      const stages = await this.getStages();
      defaultStage = stages.length > 0 ? stages[0].name : 'Planning';
    }
    
    // Ensure we have valid data structure
    const validTaskData = {
      item_id: taskData.item_id,
      parent_task_id: taskData.parent_task_id || null,
      task_order: taskData.task_order || 0,
      title: taskData.title,
      description: taskData.description,
      stage: defaultStage,
      priority: taskData.priority || 'normal',
      status: taskData.status || 'active',
      start_date: taskData.start_date,
      due_date: taskData.due_date,
      estimate_hours: taskData.estimate_hours,
      actual_hours: taskData.actual_hours,
      external_links: taskData.external_links || [],
      attachments: taskData.attachments || [],
      dependencies: taskData.dependencies || [],
      archived: taskData.archived || false,
      created_by: currentUser?.id || null,
      updated_by: currentUser?.id || null
    };

    // First create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(validTaskData)
      .select()
      .single();
    
    if (taskError) {
      console.error('❌ Supabase error creating task:', taskError);
      throw taskError;
    }
    
    // Handle assignees if provided
    if (taskData.assignee_ids && taskData.assignee_ids.length > 0) {
      const assigneeInserts = taskData.assignee_ids.map((userId: string) => ({
        task_id: task.id,
        user_id: userId
      }));
      
      const { error: assigneeError } = await supabase
        .from('task_assignees')
        .insert(assigneeInserts);
        
      if (assigneeError) {
        console.warn('⚠️ Error adding task assignees:', assigneeError);
      }
    }
    
    // Handle tags if provided
    if (taskData.tag_ids && taskData.tag_ids.length > 0) {
      const tagInserts = taskData.tag_ids.map((tagId: string) => ({
        task_id: task.id,
        tag_id: tagId
      }));
      
      const { error: tagError } = await supabase
        .from('task_tags')
        .insert(tagInserts);
        
      if (tagError) {
        console.warn('⚠️ Error adding task tags:', tagError);
      }
    }
    
    console.log('✅ Successfully created task in Supabase');
    return task;
  },

  async updateTask(taskId: string, updates: any) {
    console.log('📝 Updating task in Supabase...');
    
    const currentUser = getCurrentUser();
    
    // Extract assignee_ids and tag_ids before updating task
    const { assignee_ids, tag_ids, ...updatesWithoutIds } = updates;
    
    const updatesWithUser = {
      ...updatesWithoutIds,
      updated_by: currentUser?.id || null
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updatesWithUser)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error updating task:', error);
      throw error;
    }
    
    // Handle assignees update
    if (assignee_ids !== undefined) {
      // First, delete existing assignees
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId);
      
      // Then, insert new assignees if any
      if (assignee_ids.length > 0) {
        const assigneeInserts = assignee_ids.map((userId: string) => ({
          task_id: taskId,
          user_id: userId
        }));
        
        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert(assigneeInserts);
          
        if (assigneeError) {
          console.warn('⚠️ Error updating task assignees:', assigneeError);
        }
      }
    }
    
    // Handle tags update
    if (tag_ids !== undefined) {
      // First, delete existing tags
      await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', taskId);
      
      // Then, insert new tags if any
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tagId: string) => ({
          task_id: taskId,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(tagInserts);
          
        if (tagError) {
          console.warn('⚠️ Error updating task tags:', tagError);
        }
      }
    }
    
    console.log('✅ Successfully updated task in Supabase');
    return data;
  },

  // Get hierarchical tasks with proper nesting
  async getHierarchicalTasks(itemId?: string) {
    console.log('🔍 Fetching hierarchical tasks from Supabase...');
    
    const tasks = await this.getTasks(itemId);
    
    // Build hierarchy
    const taskMap = new Map();
    const rootTasks: any[] = [];
    
    // First pass: create map of all tasks
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });
    
    // Second pass: build hierarchy
    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id);
      
      if (task.parent_task_id) {
        const parent = taskMap.get(task.parent_task_id);
        if (parent) {
          parent.children.push(taskWithChildren);
        }
      } else {
        rootTasks.push(taskWithChildren);
      }
    });
    
    // Sort children by task_order
    const sortChildren = (tasks: any[]) => {
      tasks.sort((a, b) => a.task_order - b.task_order);
      tasks.forEach(task => {
        if (task.children.length > 0) {
          sortChildren(task.children);
        }
      });
    };
    
    sortChildren(rootTasks);
    
    return rootTasks;
  },
  async deleteTask(taskId: string) {
    console.log('🗑️ Deleting task from Supabase...');
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('❌ Supabase error deleting task:', error);
      throw error;
    }
    
    console.log('✅ Successfully deleted task from Supabase');
    return true;
  },

  // Tags
  async getTags() {
    console.log('🔍 Fetching tags from Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase error fetching tags:', error);
        throw error;
      }
      
      console.log('✅ Successfully fetched tags from Supabase:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Network error fetching tags:', error);
      // Re-throw the error so the component can handle it appropriately
      throw error;
    }
  },

  async createTag(tagData: { name: string; color: string }) {
    console.log('➕ Creating tag in Supabase...');
    
    const { data, error } = await supabase
      .from('tags')
      .insert(tagData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error creating tag:', error);
      throw error;
    }
    
    console.log('✅ Successfully created tag in Supabase');
    return data;
  },

  // Stages
  async getStages() {
    console.log('🔍 Fetching stages from Supabase...');
    
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase error fetching stages:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched stages from Supabase:', data?.length || 0);
    return data || [];
  },

  // Comments
  async getComments(parentType: string, parentId: string) {
    console.log('🔍 Fetching comments from Supabase...');
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users(*)
      `)
      .eq('parent_type', parentType)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase error fetching comments:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched comments from Supabase:', data?.length || 0);
    return data || [];
  },

  async createComment(commentData: any) {
    console.log('➕ Creating comment in Supabase...');
    
    const currentUser = getCurrentUser();
    const commentWithAuthor = {
      ...commentData,
      author_id: currentUser?.id || null
    };
    
    const { data, error } = await supabase
      .from('comments')
      .insert(commentWithAuthor)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error creating comment:', error);
      throw error;
    }
    
    console.log('✅ Successfully created comment in Supabase');
    return data;
  },

  // Activity logs
  async logActivity(activityData: any) {
    console.log('📝 Logging activity to Supabase...');
    
    const currentUser = getCurrentUser();
    const activityWithActor = {
      ...activityData,
      actor_id: currentUser?.id || null
    };
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activityWithActor)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error logging activity:', error);
      throw error;
    }
    
    console.log('✅ Successfully logged activity to Supabase');
    return data;
  },

  async getActivityLogs(targetType: string, targetId: string) {
    console.log('🔍 Fetching activity logs from Supabase...');
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        actor:users(*)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase error fetching activity logs:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched activity logs from Supabase:', data?.length || 0);
    return data || [];
  },

  // System config - return default values since this isn't stored in Supabase
  async getSystemConfig() {
    return {
      legalDepartments: ['DOJ', 'SEC', 'Bankruptcy', 'State-level', 'Federal Court', 'Appeals Court', 'Tax Court', 'District Court'],
      dealBusinessNatures: ['Acquisition', 'Joint Venture', 'Investment', 'Partnership', 'Licensing', 'Merger'],
      realEstateBusinessNatures: ['Land Sales', 'Development', 'Multifamily', 'Single Family', 'Commercial'],
      cityApprovals: ['HUD', 'MUD', 'Planning Commission', 'City Council', 'Building Permits', 'Zoning Board', 'Environmental Review', 'Fire Department']
    };
  },

  async setSystemConfig(config: any) {
    // For now, just return the config since we're not storing it in Supabase
    return config;
  },

  // Ensure sections exist in database
  async ensureSectionsExist() {
    console.log('🔍 Checking if sections exist...');
    
    const { data: existingSections, error: checkError } = await supabase
      .from('sections')
      .select('id');
    
    if (checkError) {
      console.error('❌ Error checking sections:', checkError);
      throw checkError;
    }
    
    const existingIds = existingSections?.map(s => s.id) || [];
    const requiredSections = [
      { id: 'legal', name: 'Legal Fights', slug: 'legal', icon: 'scale', color: '#dc2626' },
      { id: 'deals', name: 'Business Deals', slug: 'deals', icon: 'handshake', color: '#059669' },
      { id: 'real-estate', name: 'Real Estate', slug: 'real-estate', icon: 'building', color: '#2563eb' },
      { id: 'others', name: 'Others', slug: 'others', icon: 'folder', color: '#7c3aed' }
    ];
    
    const missingSections = requiredSections.filter(section => !existingIds.includes(section.id));
    
    if (missingSections.length > 0) {
      console.log('➕ Creating missing sections:', missingSections.map(s => s.id));
      
      const { error: insertError } = await supabase
        .from('sections')
        .insert(missingSections);
      
      if (insertError) {
        console.error('❌ Error creating sections:', insertError);
        throw insertError;
      }
      
      console.log('✅ Successfully created missing sections');
    } else {
      console.log('✅ All required sections exist');
    }
  },

  // Get sections
  async getSections() {
    console.log('🔍 Fetching sections from Supabase...');
    
    // Ensure sections exist first
    await this.ensureSectionsExist();
    
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase error fetching sections:', error);
      throw error;
    }
    
    console.log('✅ Successfully fetched sections from Supabase:', data?.length || 0);
    return data || [];
  }
};