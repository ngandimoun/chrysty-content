export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_voice_previews: {
        Row: {
          created_at: string
          language_code: string
          mime_type: string
          public_url: string
          sample_text: string
          storage_path: string
          style_label: string
          voice_name: string
        }
        Insert: {
          created_at?: string
          language_code?: string
          mime_type?: string
          public_url: string
          sample_text: string
          storage_path: string
          style_label: string
          voice_name: string
        }
        Update: {
          created_at?: string
          language_code?: string
          mime_type?: string
          public_url?: string
          sample_text?: string
          storage_path?: string
          style_label?: string
          voice_name?: string
        }
        Relationships: []
      }
      content_activity: {
        Row: {
          action: string
          content_key: string
          created_at: string
          creation_id: string
          id: string
        }
        Insert: {
          action: string
          content_key: string
          created_at?: string
          creation_id: string
          id?: string
        }
        Update: {
          action?: string
          content_key?: string
          created_at?: string
          creation_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_activity_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "content_creations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_creation_assets: {
        Row: {
          asset_type: string
          byte_size: number | null
          content_key: string
          created_at: string
          creation_id: string
          id: string
          metadata: Json
          mime_type: string
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_type: string
          byte_size?: number | null
          content_key: string
          created_at?: string
          creation_id: string
          id?: string
          metadata?: Json
          mime_type: string
          storage_bucket: string
          storage_path: string
        }
        Update: {
          asset_type?: string
          byte_size?: number | null
          content_key?: string
          created_at?: string
          creation_id?: string
          id?: string
          metadata?: Json
          mime_type?: string
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_creation_assets_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "content_creations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_creations: {
        Row: {
          artwork_gradient: string
          category: string
          content_key: string
          content_subtype: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_favorite: boolean
          last_opened_at: string
          metadata: Json
          archived_at: string | null
          generation_progress: number | null
          page_count: number | null
          setup: Json
          status: string
          tags: string[]
          title: string
          topic: string | null
          type: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          artwork_gradient?: string
          category: string
          content_key: string
          content_subtype?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          generation_progress?: number | null
          id?: string
          is_favorite?: boolean
          last_opened_at?: string
          metadata?: Json
          page_count?: number | null
          setup?: Json
          status?: string
          tags?: string[]
          title: string
          topic?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          artwork_gradient?: string
          category?: string
          content_key?: string
          content_subtype?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          generation_progress?: number | null
          id?: string
          is_favorite?: boolean
          last_opened_at?: string
          metadata?: Json
          page_count?: number | null
          setup?: Json
          status?: string
          tags?: string[]
          title?: string
          topic?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_creations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "content_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_consumption_annotations: {
        Row: {
          anchor_text: string | null
          content_key: string | null
          created_at: string
          creation_id: string
          id: string
          kind: string
          note_text: string | null
          page_number: number | null
          position_seconds: number | null
          segment_id: string | null
          selected_text: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anchor_text?: string | null
          content_key?: string | null
          created_at?: string
          creation_id: string
          id?: string
          kind: string
          note_text?: string | null
          page_number?: number | null
          position_seconds?: number | null
          segment_id?: string | null
          selected_text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anchor_text?: string | null
          content_key?: string | null
          created_at?: string
          creation_id?: string
          id?: string
          kind?: string
          note_text?: string | null
          page_number?: number | null
          position_seconds?: number | null
          segment_id?: string | null
          selected_text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_consumption_annotations_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "content_creations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_consumption_events: {
        Row: {
          content_key: string | null
          created_at: string
          creation_id: string
          event_type: string
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          content_key?: string | null
          created_at?: string
          creation_id: string
          event_type: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          content_key?: string | null
          created_at?: string
          creation_id?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_consumption_events_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "content_creations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_consumption_progress: {
        Row: {
          completed_at: string | null
          consumption_status: string
          content_key: string | null
          created_at: string
          creation_id: string
          current_page: number | null
          current_position_seconds: number | null
          id: string
          last_opened_at: string | null
          last_played_at: string | null
          playback_speed: number
          progress_percent: number
          resume_context: Json
          session_count: number
          started_at: string | null
          time_spent_seconds: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          consumption_status?: string
          content_key?: string | null
          created_at?: string
          creation_id: string
          current_page?: number | null
          current_position_seconds?: number | null
          id?: string
          last_opened_at?: string | null
          last_played_at?: string | null
          playback_speed?: number
          progress_percent?: number
          resume_context?: Json
          session_count?: number
          started_at?: string | null
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          consumption_status?: string
          content_key?: string | null
          created_at?: string
          creation_id?: string
          current_page?: number | null
          current_position_seconds?: number | null
          id?: string
          last_opened_at?: string | null
          last_played_at?: string | null
          playback_speed?: number
          progress_percent?: number
          resume_context?: Json
          session_count?: number
          started_at?: string | null
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_consumption_progress_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "content_creations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_workspaces: {
        Row: {
          content_key: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          platform_workspace_id: string | null
          settings: Json
          updated_at: string
          user_id: string | null
          visitor_token: string
        }
        Insert: {
          content_key: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Update: {
          content_key?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_workspaces_platform_workspace_id_fkey"
            columns: ["platform_workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_files: {
        Row: {
          content: string | null
          created_at: string
          filename: string
          id: string
          media_url: string | null
          mime_type: string
          moonshot_id: string
          purpose: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          filename: string
          id: string
          media_url?: string | null
          mime_type: string
          moonshot_id: string
          purpose: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          filename?: string
          id?: string
          media_url?: string | null
          mime_type?: string
          moonshot_id?: string
          purpose?: string
          user_id?: string | null
        }
        Relationships: []
      }
      learning_generation_log: {
        Row: {
          created_at: string
          id: string
          learner_key: string
          session_id: string | null
          session_type: string
          source_prompt: string | null
          subject: string | null
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          learner_key: string
          session_id?: string | null
          session_type: string
          source_prompt?: string | null
          subject?: string | null
          summary?: Json
        }
        Update: {
          created_at?: string
          id?: string
          learner_key?: string
          session_id?: string | null
          session_type?: string
          source_prompt?: string | null
          subject?: string | null
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "learning_generation_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_interactions: {
        Row: {
          action_type: string
          ai_response: string
          card_id: string | null
          created_at: string
          id: string
          metadata: Json
          session_id: string
          user_id: string | null
          user_message: string
        }
        Insert: {
          action_type: string
          ai_response?: string
          card_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id: string
          user_id?: string | null
          user_message?: string
        }
        Update: {
          action_type?: string
          ai_response?: string
          card_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id?: string
          user_id?: string | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_learner_memory: {
        Row: {
          learner_key: string
          memory: Json
          narrative_digest: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          learner_key: string
          memory?: Json
          narrative_digest?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          learner_key?: string
          memory?: Json
          narrative_digest?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      learning_session_files: {
        Row: {
          file_id: string
          session_id: string
        }
        Insert: {
          file_id: string
          session_id: string
        }
        Update: {
          file_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_session_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "learning_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_session_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          content: Json | null
          created_at: string
          current_topic: string
          id: string
          learner_key: string | null
          progress: number
          source_prompt: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
          worker_slug: string
          workspace_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          current_topic?: string
          id: string
          learner_key?: string | null
          progress?: number
          source_prompt?: string | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
          worker_slug?: string
          workspace_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          current_topic?: string
          id?: string
          learner_key?: string | null
          progress?: number
          source_prompt?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          worker_slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "learning_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_workspaces: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          platform_workspace_id: string | null
          settings: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_workspaces_platform_workspace_id_fkey"
            columns: ["platform_workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_asset_events: {
        Row: {
          id: string
          occurred_at: string
          payload: Json
          sequence: number
          type: string
          workspace_id: string
        }
        Insert: {
          id: string
          occurred_at: string
          payload?: Json
          sequence: number
          type: string
          workspace_id: string
        }
        Update: {
          id?: string
          occurred_at?: string
          payload?: Json
          sequence?: number
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_asset_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ledger_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_asset_links: {
        Row: {
          created_at: string
          from_asset_id: string
          id: string
          relation: string
          to_asset_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          from_asset_id: string
          id?: string
          relation: string
          to_asset_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          from_asset_id?: string
          id?: string
          relation?: string
          to_asset_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_asset_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ledger_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_assets: {
        Row: {
          archived_at: string | null
          asset_data: Json
          asset_schema: Json
          category: string
          created_at: string
          creation_sequence: number
          id: string
          kind: string
          metadata: Json
          payload: Json
          project_id: string | null
          relations: Json
          source_message_id: string | null
          subtype: string | null
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          asset_data?: Json
          asset_schema?: Json
          category: string
          created_at?: string
          creation_sequence: number
          id: string
          kind: string
          metadata?: Json
          payload: Json
          project_id?: string | null
          relations?: Json
          source_message_id?: string | null
          subtype?: string | null
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          asset_data?: Json
          asset_schema?: Json
          category?: string
          created_at?: string
          creation_sequence?: number
          id?: string
          kind?: string
          metadata?: Json
          payload?: Json
          project_id?: string | null
          relations?: Json
          source_message_id?: string | null
          subtype?: string | null
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ledger_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ledger_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_messages: {
        Row: {
          created_at: string
          id: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id: string
          payload: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ledger_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_projects: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ledger_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_workspaces: {
        Row: {
          canvas_state: Json
          created_at: string
          id: string
          is_default: boolean
          ledger_key: string | null
          name: string
          platform_workspace_id: string | null
          settings: Json
          updated_at: string
          user_id: string | null
          visitor_token: string
        }
        Insert: {
          canvas_state?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          ledger_key?: string | null
          name: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Update: {
          canvas_state?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          ledger_key?: string | null
          name?: string
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_workspaces_platform_workspace_id_fkey"
            columns: ["platform_workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mastra_agent_versions: {
        Row: {
          agentId: string
          agents: Json | null
          browser: Json | null
          changedFields: Json | null
          changeMessage: string | null
          createdAt: string
          createdAtZ: string | null
          defaultOptions: Json | null
          description: string | null
          id: string
          inputProcessors: Json | null
          instructions: string
          integrationTools: Json | null
          mcpClients: Json | null
          memory: Json | null
          model: Json
          name: string
          outputProcessors: Json | null
          requestContextSchema: Json | null
          scorers: Json | null
          skills: Json | null
          skillsFormat: string | null
          toolProviders: Json | null
          tools: Json | null
          versionNumber: number
          workflows: Json | null
          workspace: Json | null
        }
        Insert: {
          agentId: string
          agents?: Json | null
          browser?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt: string
          createdAtZ?: string | null
          defaultOptions?: Json | null
          description?: string | null
          id: string
          inputProcessors?: Json | null
          instructions: string
          integrationTools?: Json | null
          mcpClients?: Json | null
          memory?: Json | null
          model: Json
          name: string
          outputProcessors?: Json | null
          requestContextSchema?: Json | null
          scorers?: Json | null
          skills?: Json | null
          skillsFormat?: string | null
          toolProviders?: Json | null
          tools?: Json | null
          versionNumber: number
          workflows?: Json | null
          workspace?: Json | null
        }
        Update: {
          agentId?: string
          agents?: Json | null
          browser?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt?: string
          createdAtZ?: string | null
          defaultOptions?: Json | null
          description?: string | null
          id?: string
          inputProcessors?: Json | null
          instructions?: string
          integrationTools?: Json | null
          mcpClients?: Json | null
          memory?: Json | null
          model?: Json
          name?: string
          outputProcessors?: Json | null
          requestContextSchema?: Json | null
          scorers?: Json | null
          skills?: Json | null
          skillsFormat?: string | null
          toolProviders?: Json | null
          tools?: Json | null
          versionNumber?: number
          workflows?: Json | null
          workspace?: Json | null
        }
        Relationships: []
      }
      mastra_agents: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          favoriteCount: number | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
          visibility: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          favoriteCount?: number | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
          visibility?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          favoriteCount?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      mastra_ai_spans: {
        Row: {
          attributes: Json | null
          createdAt: string
          createdAtZ: string | null
          endedAt: string | null
          endedAtZ: string | null
          entityId: string | null
          entityName: string | null
          entityType: string | null
          entityVersionId: string | null
          environment: string | null
          error: Json | null
          experimentId: string | null
          input: Json | null
          isEvent: boolean
          links: Json | null
          metadata: Json | null
          name: string
          organizationId: string | null
          output: Json | null
          parentEntityId: string | null
          parentEntityName: string | null
          parentEntityType: string | null
          parentEntityVersionId: string | null
          parentSpanId: string | null
          requestContext: Json | null
          requestId: string | null
          resourceId: string | null
          rootEntityId: string | null
          rootEntityName: string | null
          rootEntityType: string | null
          rootEntityVersionId: string | null
          runId: string | null
          scope: Json | null
          serviceName: string | null
          sessionId: string | null
          source: string | null
          spanId: string
          spanType: string
          startedAt: string
          startedAtZ: string | null
          tags: Json | null
          threadId: string | null
          traceId: string
          updatedAt: string | null
          updatedAtZ: string | null
          userId: string | null
        }
        Insert: {
          attributes?: Json | null
          createdAt: string
          createdAtZ?: string | null
          endedAt?: string | null
          endedAtZ?: string | null
          entityId?: string | null
          entityName?: string | null
          entityType?: string | null
          entityVersionId?: string | null
          environment?: string | null
          error?: Json | null
          experimentId?: string | null
          input?: Json | null
          isEvent: boolean
          links?: Json | null
          metadata?: Json | null
          name: string
          organizationId?: string | null
          output?: Json | null
          parentEntityId?: string | null
          parentEntityName?: string | null
          parentEntityType?: string | null
          parentEntityVersionId?: string | null
          parentSpanId?: string | null
          requestContext?: Json | null
          requestId?: string | null
          resourceId?: string | null
          rootEntityId?: string | null
          rootEntityName?: string | null
          rootEntityType?: string | null
          rootEntityVersionId?: string | null
          runId?: string | null
          scope?: Json | null
          serviceName?: string | null
          sessionId?: string | null
          source?: string | null
          spanId: string
          spanType: string
          startedAt: string
          startedAtZ?: string | null
          tags?: Json | null
          threadId?: string | null
          traceId: string
          updatedAt?: string | null
          updatedAtZ?: string | null
          userId?: string | null
        }
        Update: {
          attributes?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          endedAt?: string | null
          endedAtZ?: string | null
          entityId?: string | null
          entityName?: string | null
          entityType?: string | null
          entityVersionId?: string | null
          environment?: string | null
          error?: Json | null
          experimentId?: string | null
          input?: Json | null
          isEvent?: boolean
          links?: Json | null
          metadata?: Json | null
          name?: string
          organizationId?: string | null
          output?: Json | null
          parentEntityId?: string | null
          parentEntityName?: string | null
          parentEntityType?: string | null
          parentEntityVersionId?: string | null
          parentSpanId?: string | null
          requestContext?: Json | null
          requestId?: string | null
          resourceId?: string | null
          rootEntityId?: string | null
          rootEntityName?: string | null
          rootEntityType?: string | null
          rootEntityVersionId?: string | null
          runId?: string | null
          scope?: Json | null
          serviceName?: string | null
          sessionId?: string | null
          source?: string | null
          spanId?: string
          spanType?: string
          startedAt?: string
          startedAtZ?: string | null
          tags?: Json | null
          threadId?: string | null
          traceId?: string
          updatedAt?: string | null
          updatedAtZ?: string | null
          userId?: string | null
        }
        Relationships: []
      }
      mastra_background_tasks: {
        Row: {
          agent_id: string
          args: Json
          completedAt: string | null
          completedAtZ: string | null
          createdAt: string
          createdAtZ: string | null
          error: Json | null
          id: string
          max_retries: number
          resource_id: string | null
          result: Json | null
          retry_count: number
          run_id: string
          startedAt: string | null
          startedAtZ: string | null
          status: string
          suspend_payload: Json | null
          suspendedAt: string | null
          suspendedAtZ: string | null
          thread_id: string | null
          timeout_ms: number
          tool_call_id: string
          tool_name: string
        }
        Insert: {
          agent_id: string
          args: Json
          completedAt?: string | null
          completedAtZ?: string | null
          createdAt: string
          createdAtZ?: string | null
          error?: Json | null
          id: string
          max_retries: number
          resource_id?: string | null
          result?: Json | null
          retry_count: number
          run_id: string
          startedAt?: string | null
          startedAtZ?: string | null
          status: string
          suspend_payload?: Json | null
          suspendedAt?: string | null
          suspendedAtZ?: string | null
          thread_id?: string | null
          timeout_ms: number
          tool_call_id: string
          tool_name: string
        }
        Update: {
          agent_id?: string
          args?: Json
          completedAt?: string | null
          completedAtZ?: string | null
          createdAt?: string
          createdAtZ?: string | null
          error?: Json | null
          id?: string
          max_retries?: number
          resource_id?: string | null
          result?: Json | null
          retry_count?: number
          run_id?: string
          startedAt?: string | null
          startedAtZ?: string | null
          status?: string
          suspend_payload?: Json | null
          suspendedAt?: string | null
          suspendedAtZ?: string | null
          thread_id?: string | null
          timeout_ms?: number
          tool_call_id?: string
          tool_name?: string
        }
        Relationships: []
      }
      mastra_channel_config: {
        Row: {
          data: Json
          platform: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          data: Json
          platform: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          data?: Json
          platform?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_channel_installations: {
        Row: {
          agentId: string
          configHash: string | null
          createdAt: string
          createdAtZ: string | null
          data: Json
          error: string | null
          id: string
          platform: string
          status: string
          updatedAt: string
          updatedAtZ: string | null
          webhookId: string | null
        }
        Insert: {
          agentId: string
          configHash?: string | null
          createdAt: string
          createdAtZ?: string | null
          data: Json
          error?: string | null
          id: string
          platform: string
          status: string
          updatedAt: string
          updatedAtZ?: string | null
          webhookId?: string | null
        }
        Update: {
          agentId?: string
          configHash?: string | null
          createdAt?: string
          createdAtZ?: string | null
          data?: Json
          error?: string | null
          id?: string
          platform?: string
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
          webhookId?: string | null
        }
        Relationships: []
      }
      mastra_dataset_items: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          datasetId: string
          datasetVersion: number
          expectedTrajectory: Json | null
          groundTruth: Json | null
          id: string
          input: Json
          isDeleted: boolean
          metadata: Json | null
          requestContext: Json | null
          source: Json | null
          updatedAt: string
          updatedAtZ: string | null
          validTo: number | null
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          datasetId: string
          datasetVersion: number
          expectedTrajectory?: Json | null
          groundTruth?: Json | null
          id: string
          input: Json
          isDeleted: boolean
          metadata?: Json | null
          requestContext?: Json | null
          source?: Json | null
          updatedAt: string
          updatedAtZ?: string | null
          validTo?: number | null
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          datasetId?: string
          datasetVersion?: number
          expectedTrajectory?: Json | null
          groundTruth?: Json | null
          id?: string
          input?: Json
          isDeleted?: boolean
          metadata?: Json | null
          requestContext?: Json | null
          source?: Json | null
          updatedAt?: string
          updatedAtZ?: string | null
          validTo?: number | null
        }
        Relationships: []
      }
      mastra_dataset_versions: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          datasetId: string
          id: string
          version: number
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          datasetId: string
          id: string
          version: number
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          datasetId?: string
          id?: string
          version?: number
        }
        Relationships: []
      }
      mastra_datasets: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          description: string | null
          groundTruthSchema: Json | null
          id: string
          inputSchema: Json | null
          metadata: Json | null
          name: string
          requestContextSchema: Json | null
          scorerIds: Json | null
          tags: Json | null
          targetIds: Json | null
          targetType: string | null
          updatedAt: string
          updatedAtZ: string | null
          version: number
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          description?: string | null
          groundTruthSchema?: Json | null
          id: string
          inputSchema?: Json | null
          metadata?: Json | null
          name: string
          requestContextSchema?: Json | null
          scorerIds?: Json | null
          tags?: Json | null
          targetIds?: Json | null
          targetType?: string | null
          updatedAt: string
          updatedAtZ?: string | null
          version: number
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          description?: string | null
          groundTruthSchema?: Json | null
          id?: string
          inputSchema?: Json | null
          metadata?: Json | null
          name?: string
          requestContextSchema?: Json | null
          scorerIds?: Json | null
          tags?: Json | null
          targetIds?: Json | null
          targetType?: string | null
          updatedAt?: string
          updatedAtZ?: string | null
          version?: number
        }
        Relationships: []
      }
      mastra_experiment_results: {
        Row: {
          completedAt: string
          completedAtZ: string | null
          createdAt: string
          createdAtZ: string | null
          error: Json | null
          experimentId: string
          groundTruth: Json | null
          id: string
          input: Json
          itemDatasetVersion: number | null
          itemId: string
          output: Json | null
          retryCount: number
          startedAt: string
          startedAtZ: string | null
          status: string | null
          tags: Json | null
          traceId: string | null
        }
        Insert: {
          completedAt: string
          completedAtZ?: string | null
          createdAt: string
          createdAtZ?: string | null
          error?: Json | null
          experimentId: string
          groundTruth?: Json | null
          id: string
          input: Json
          itemDatasetVersion?: number | null
          itemId: string
          output?: Json | null
          retryCount: number
          startedAt: string
          startedAtZ?: string | null
          status?: string | null
          tags?: Json | null
          traceId?: string | null
        }
        Update: {
          completedAt?: string
          completedAtZ?: string | null
          createdAt?: string
          createdAtZ?: string | null
          error?: Json | null
          experimentId?: string
          groundTruth?: Json | null
          id?: string
          input?: Json
          itemDatasetVersion?: number | null
          itemId?: string
          output?: Json | null
          retryCount?: number
          startedAt?: string
          startedAtZ?: string | null
          status?: string | null
          tags?: Json | null
          traceId?: string | null
        }
        Relationships: []
      }
      mastra_experiments: {
        Row: {
          agentVersion: string | null
          completedAt: string | null
          completedAtZ: string | null
          createdAt: string
          createdAtZ: string | null
          datasetId: string | null
          datasetVersion: number | null
          description: string | null
          failedCount: number
          id: string
          metadata: Json | null
          name: string | null
          skippedCount: number
          startedAt: string | null
          startedAtZ: string | null
          status: string
          succeededCount: number
          targetId: string
          targetType: string
          totalItems: number
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          agentVersion?: string | null
          completedAt?: string | null
          completedAtZ?: string | null
          createdAt: string
          createdAtZ?: string | null
          datasetId?: string | null
          datasetVersion?: number | null
          description?: string | null
          failedCount: number
          id: string
          metadata?: Json | null
          name?: string | null
          skippedCount: number
          startedAt?: string | null
          startedAtZ?: string | null
          status: string
          succeededCount: number
          targetId: string
          targetType: string
          totalItems: number
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          agentVersion?: string | null
          completedAt?: string | null
          completedAtZ?: string | null
          createdAt?: string
          createdAtZ?: string | null
          datasetId?: string | null
          datasetVersion?: number | null
          description?: string | null
          failedCount?: number
          id?: string
          metadata?: Json | null
          name?: string | null
          skippedCount?: number
          startedAt?: string | null
          startedAtZ?: string | null
          status?: string
          succeededCount?: number
          targetId?: string
          targetType?: string
          totalItems?: number
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_favorites: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          entityId: string
          entityType: string
          userId: string
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          entityId: string
          entityType: string
          userId: string
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          entityId?: string
          entityType?: string
          userId?: string
        }
        Relationships: []
      }
      mastra_mcp_client_versions: {
        Row: {
          changedFields: Json | null
          changeMessage: string | null
          createdAt: string
          createdAtZ: string | null
          description: string | null
          id: string
          mcpClientId: string
          name: string
          servers: Json
          versionNumber: number
        }
        Insert: {
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt: string
          createdAtZ?: string | null
          description?: string | null
          id: string
          mcpClientId: string
          name: string
          servers: Json
          versionNumber: number
        }
        Update: {
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt?: string
          createdAtZ?: string | null
          description?: string | null
          id?: string
          mcpClientId?: string
          name?: string
          servers?: Json
          versionNumber?: number
        }
        Relationships: []
      }
      mastra_mcp_clients: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_mcp_server_versions: {
        Row: {
          agents: Json | null
          changedFields: Json | null
          changeMessage: string | null
          createdAt: string
          createdAtZ: string | null
          description: string | null
          id: string
          instructions: string | null
          isLatest: boolean | null
          mcpServerId: string
          name: string
          packageCanonical: string | null
          releaseDate: string | null
          repository: Json | null
          tools: Json | null
          version: string
          versionNumber: number
          workflows: Json | null
        }
        Insert: {
          agents?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt: string
          createdAtZ?: string | null
          description?: string | null
          id: string
          instructions?: string | null
          isLatest?: boolean | null
          mcpServerId: string
          name: string
          packageCanonical?: string | null
          releaseDate?: string | null
          repository?: Json | null
          tools?: Json | null
          version: string
          versionNumber: number
          workflows?: Json | null
        }
        Update: {
          agents?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt?: string
          createdAtZ?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          isLatest?: boolean | null
          mcpServerId?: string
          name?: string
          packageCanonical?: string | null
          releaseDate?: string | null
          repository?: Json | null
          tools?: Json | null
          version?: string
          versionNumber?: number
          workflows?: Json | null
        }
        Relationships: []
      }
      mastra_mcp_servers: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_messages: {
        Row: {
          content: string
          createdAt: string
          createdAtZ: string | null
          id: string
          resourceId: string | null
          role: string
          thread_id: string
          type: string
        }
        Insert: {
          content: string
          createdAt: string
          createdAtZ?: string | null
          id: string
          resourceId?: string | null
          role: string
          thread_id: string
          type: string
        }
        Update: {
          content?: string
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          resourceId?: string | null
          role?: string
          thread_id?: string
          type?: string
        }
        Relationships: []
      }
      mastra_notifications: {
        Row: {
          agentId: string | null
          archivedAt: string | null
          archivedAtZ: string | null
          attributes: Json | null
          coalescedCount: number
          coalesceKey: string | null
          createdAt: string
          createdAtZ: string | null
          dedupeKey: string | null
          deliverAt: string | null
          deliverAtZ: string | null
          deliveredAt: string | null
          deliveredAtZ: string | null
          deliveredSignalId: string | null
          deliveryAttempts: number
          deliveryReason: string | null
          discardedAt: string | null
          discardedAtZ: string | null
          dismissedAt: string | null
          dismissedAtZ: string | null
          id: string
          kind: string
          lastDeliveryAttemptAt: string | null
          lastDeliveryAttemptAtZ: string | null
          lastDeliveryError: string | null
          metadata: Json | null
          payload: Json | null
          priority: string
          resourceId: string | null
          seenAt: string | null
          seenAtZ: string | null
          source: string
          sourceId: string | null
          status: string
          summary: string
          summaryAt: string | null
          summaryAtZ: string | null
          summarySignalId: string | null
          threadId: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          agentId?: string | null
          archivedAt?: string | null
          archivedAtZ?: string | null
          attributes?: Json | null
          coalescedCount: number
          coalesceKey?: string | null
          createdAt: string
          createdAtZ?: string | null
          dedupeKey?: string | null
          deliverAt?: string | null
          deliverAtZ?: string | null
          deliveredAt?: string | null
          deliveredAtZ?: string | null
          deliveredSignalId?: string | null
          deliveryAttempts: number
          deliveryReason?: string | null
          discardedAt?: string | null
          discardedAtZ?: string | null
          dismissedAt?: string | null
          dismissedAtZ?: string | null
          id: string
          kind: string
          lastDeliveryAttemptAt?: string | null
          lastDeliveryAttemptAtZ?: string | null
          lastDeliveryError?: string | null
          metadata?: Json | null
          payload?: Json | null
          priority: string
          resourceId?: string | null
          seenAt?: string | null
          seenAtZ?: string | null
          source: string
          sourceId?: string | null
          status: string
          summary: string
          summaryAt?: string | null
          summaryAtZ?: string | null
          summarySignalId?: string | null
          threadId: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          agentId?: string | null
          archivedAt?: string | null
          archivedAtZ?: string | null
          attributes?: Json | null
          coalescedCount?: number
          coalesceKey?: string | null
          createdAt?: string
          createdAtZ?: string | null
          dedupeKey?: string | null
          deliverAt?: string | null
          deliverAtZ?: string | null
          deliveredAt?: string | null
          deliveredAtZ?: string | null
          deliveredSignalId?: string | null
          deliveryAttempts?: number
          deliveryReason?: string | null
          discardedAt?: string | null
          discardedAtZ?: string | null
          dismissedAt?: string | null
          dismissedAtZ?: string | null
          id?: string
          kind?: string
          lastDeliveryAttemptAt?: string | null
          lastDeliveryAttemptAtZ?: string | null
          lastDeliveryError?: string | null
          metadata?: Json | null
          payload?: Json | null
          priority?: string
          resourceId?: string | null
          seenAt?: string | null
          seenAtZ?: string | null
          source?: string
          sourceId?: string | null
          status?: string
          summary?: string
          summaryAt?: string | null
          summaryAtZ?: string | null
          summarySignalId?: string | null
          threadId?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_observational_memory: {
        Row: {
          activeObservations: string
          activeObservationsPendingUpdate: string | null
          bufferedMessageIds: Json | null
          bufferedObservationChunks: Json | null
          bufferedObservations: string | null
          bufferedObservationTokens: number | null
          bufferedReflection: string | null
          bufferedReflectionInputTokens: number | null
          bufferedReflectionTokens: number | null
          config: string
          createdAt: string
          createdAtZ: string | null
          generationCount: number
          id: string
          isBufferingObservation: boolean
          isBufferingReflection: boolean
          isObserving: boolean
          isReflecting: boolean
          lastBufferedAtTime: string | null
          lastBufferedAtTimeZ: string | null
          lastBufferedAtTokens: number
          lastObservedAt: string | null
          lastObservedAtZ: string | null
          lastReflectionAt: string | null
          lastReflectionAtZ: string | null
          lookupKey: string
          metadata: Json | null
          observationTokenCount: number
          observedMessageIds: Json | null
          observedTimezone: string | null
          originType: string
          pendingMessageTokens: number
          reflectedObservationLineCount: number | null
          resourceId: string | null
          scope: string
          threadId: string | null
          totalTokensObserved: number
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeObservations: string
          activeObservationsPendingUpdate?: string | null
          bufferedMessageIds?: Json | null
          bufferedObservationChunks?: Json | null
          bufferedObservations?: string | null
          bufferedObservationTokens?: number | null
          bufferedReflection?: string | null
          bufferedReflectionInputTokens?: number | null
          bufferedReflectionTokens?: number | null
          config: string
          createdAt: string
          createdAtZ?: string | null
          generationCount: number
          id: string
          isBufferingObservation: boolean
          isBufferingReflection: boolean
          isObserving: boolean
          isReflecting: boolean
          lastBufferedAtTime?: string | null
          lastBufferedAtTimeZ?: string | null
          lastBufferedAtTokens: number
          lastObservedAt?: string | null
          lastObservedAtZ?: string | null
          lastReflectionAt?: string | null
          lastReflectionAtZ?: string | null
          lookupKey: string
          metadata?: Json | null
          observationTokenCount: number
          observedMessageIds?: Json | null
          observedTimezone?: string | null
          originType: string
          pendingMessageTokens: number
          reflectedObservationLineCount?: number | null
          resourceId?: string | null
          scope: string
          threadId?: string | null
          totalTokensObserved: number
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeObservations?: string
          activeObservationsPendingUpdate?: string | null
          bufferedMessageIds?: Json | null
          bufferedObservationChunks?: Json | null
          bufferedObservations?: string | null
          bufferedObservationTokens?: number | null
          bufferedReflection?: string | null
          bufferedReflectionInputTokens?: number | null
          bufferedReflectionTokens?: number | null
          config?: string
          createdAt?: string
          createdAtZ?: string | null
          generationCount?: number
          id?: string
          isBufferingObservation?: boolean
          isBufferingReflection?: boolean
          isObserving?: boolean
          isReflecting?: boolean
          lastBufferedAtTime?: string | null
          lastBufferedAtTimeZ?: string | null
          lastBufferedAtTokens?: number
          lastObservedAt?: string | null
          lastObservedAtZ?: string | null
          lastReflectionAt?: string | null
          lastReflectionAtZ?: string | null
          lookupKey?: string
          metadata?: Json | null
          observationTokenCount?: number
          observedMessageIds?: Json | null
          observedTimezone?: string | null
          originType?: string
          pendingMessageTokens?: number
          reflectedObservationLineCount?: number | null
          resourceId?: string | null
          scope?: string
          threadId?: string | null
          totalTokensObserved?: number
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_prompt_block_versions: {
        Row: {
          blockId: string
          changedFields: Json | null
          changeMessage: string | null
          content: string
          createdAt: string
          createdAtZ: string | null
          description: string | null
          id: string
          name: string
          requestContextSchema: Json | null
          rules: Json | null
          versionNumber: number
        }
        Insert: {
          blockId: string
          changedFields?: Json | null
          changeMessage?: string | null
          content: string
          createdAt: string
          createdAtZ?: string | null
          description?: string | null
          id: string
          name: string
          requestContextSchema?: Json | null
          rules?: Json | null
          versionNumber: number
        }
        Update: {
          blockId?: string
          changedFields?: Json | null
          changeMessage?: string | null
          content?: string
          createdAt?: string
          createdAtZ?: string | null
          description?: string | null
          id?: string
          name?: string
          requestContextSchema?: Json | null
          rules?: Json | null
          versionNumber?: number
        }
        Relationships: []
      }
      mastra_prompt_blocks: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_resources: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          updatedAt: string
          updatedAtZ: string | null
          workingMemory: string | null
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          updatedAt: string
          updatedAtZ?: string | null
          workingMemory?: string | null
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          updatedAt?: string
          updatedAtZ?: string | null
          workingMemory?: string | null
        }
        Relationships: []
      }
      mastra_schedule_triggers: {
        Row: {
          actual_fire_at: number
          error: string | null
          id: string
          metadata: Json | null
          outcome: string
          parent_trigger_id: string | null
          run_id: string | null
          schedule_id: string
          scheduled_fire_at: number
          trigger_kind: string
        }
        Insert: {
          actual_fire_at: number
          error?: string | null
          id: string
          metadata?: Json | null
          outcome: string
          parent_trigger_id?: string | null
          run_id?: string | null
          schedule_id: string
          scheduled_fire_at: number
          trigger_kind: string
        }
        Update: {
          actual_fire_at?: number
          error?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string
          parent_trigger_id?: string | null
          run_id?: string | null
          schedule_id?: string
          scheduled_fire_at?: number
          trigger_kind?: string
        }
        Relationships: []
      }
      mastra_schedules: {
        Row: {
          created_at: number
          cron: string
          id: string
          last_fire_at: number | null
          last_run_id: string | null
          metadata: Json | null
          next_fire_at: number
          owner_id: string | null
          owner_type: string | null
          status: string
          target: Json
          timezone: string | null
          updated_at: number
        }
        Insert: {
          created_at: number
          cron: string
          id: string
          last_fire_at?: number | null
          last_run_id?: string | null
          metadata?: Json | null
          next_fire_at: number
          owner_id?: string | null
          owner_type?: string | null
          status: string
          target: Json
          timezone?: string | null
          updated_at: number
        }
        Update: {
          created_at?: number
          cron?: string
          id?: string
          last_fire_at?: number | null
          last_run_id?: string | null
          metadata?: Json | null
          next_fire_at?: number
          owner_id?: string | null
          owner_type?: string | null
          status?: string
          target?: Json
          timezone?: string | null
          updated_at?: number
        }
        Relationships: []
      }
      mastra_scorer_definition_versions: {
        Row: {
          changedFields: Json | null
          changeMessage: string | null
          createdAt: string
          createdAtZ: string | null
          defaultSampling: Json | null
          description: string | null
          id: string
          instructions: string | null
          model: Json | null
          name: string
          presetConfig: Json | null
          scoreRange: Json | null
          scorerDefinitionId: string
          type: string
          versionNumber: number
        }
        Insert: {
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt: string
          createdAtZ?: string | null
          defaultSampling?: Json | null
          description?: string | null
          id: string
          instructions?: string | null
          model?: Json | null
          name: string
          presetConfig?: Json | null
          scoreRange?: Json | null
          scorerDefinitionId: string
          type: string
          versionNumber: number
        }
        Update: {
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt?: string
          createdAtZ?: string | null
          defaultSampling?: Json | null
          description?: string | null
          id?: string
          instructions?: string | null
          model?: Json | null
          name?: string
          presetConfig?: Json | null
          scoreRange?: Json | null
          scorerDefinitionId?: string
          type?: string
          versionNumber?: number
        }
        Relationships: []
      }
      mastra_scorer_definitions: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_scorers: {
        Row: {
          additionalContext: Json | null
          analyzePrompt: string | null
          analyzeStepResult: Json | null
          createdAt: string
          createdAtZ: string | null
          entity: Json | null
          entityId: string | null
          entityType: string | null
          extractPrompt: string | null
          extractStepResult: Json | null
          generateReasonPrompt: string | null
          generateScorePrompt: string | null
          id: string
          input: Json
          metadata: Json | null
          output: Json
          preprocessPrompt: string | null
          preprocessStepResult: Json | null
          reason: string | null
          reasonPrompt: string | null
          requestContext: Json | null
          resourceId: string | null
          runId: string
          score: number
          scorer: Json
          scorerId: string
          source: string
          spanId: string | null
          threadId: string | null
          traceId: string | null
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          additionalContext?: Json | null
          analyzePrompt?: string | null
          analyzeStepResult?: Json | null
          createdAt: string
          createdAtZ?: string | null
          entity?: Json | null
          entityId?: string | null
          entityType?: string | null
          extractPrompt?: string | null
          extractStepResult?: Json | null
          generateReasonPrompt?: string | null
          generateScorePrompt?: string | null
          id: string
          input: Json
          metadata?: Json | null
          output: Json
          preprocessPrompt?: string | null
          preprocessStepResult?: Json | null
          reason?: string | null
          reasonPrompt?: string | null
          requestContext?: Json | null
          resourceId?: string | null
          runId: string
          score: number
          scorer: Json
          scorerId: string
          source: string
          spanId?: string | null
          threadId?: string | null
          traceId?: string | null
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          additionalContext?: Json | null
          analyzePrompt?: string | null
          analyzeStepResult?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          entity?: Json | null
          entityId?: string | null
          entityType?: string | null
          extractPrompt?: string | null
          extractStepResult?: Json | null
          generateReasonPrompt?: string | null
          generateScorePrompt?: string | null
          id?: string
          input?: Json
          metadata?: Json | null
          output?: Json
          preprocessPrompt?: string | null
          preprocessStepResult?: Json | null
          reason?: string | null
          reasonPrompt?: string | null
          requestContext?: Json | null
          resourceId?: string | null
          runId?: string
          score?: number
          scorer?: Json
          scorerId?: string
          source?: string
          spanId?: string | null
          threadId?: string | null
          traceId?: string | null
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_skill_blobs: {
        Row: {
          content: string
          createdAt: string
          createdAtZ: string | null
          hash: string
          mimeType: string | null
          size: number
        }
        Insert: {
          content: string
          createdAt: string
          createdAtZ?: string | null
          hash: string
          mimeType?: string | null
          size: number
        }
        Update: {
          content?: string
          createdAt?: string
          createdAtZ?: string | null
          hash?: string
          mimeType?: string | null
          size?: number
        }
        Relationships: []
      }
      mastra_skill_versions: {
        Row: {
          assets: Json | null
          changedFields: Json | null
          changeMessage: string | null
          compatibility: Json | null
          createdAt: string
          createdAtZ: string | null
          description: string
          files: Json | null
          id: string
          instructions: string
          license: string | null
          metadata: Json | null
          name: string
          references: Json | null
          scripts: Json | null
          skillId: string
          source: Json | null
          tree: Json | null
          versionNumber: number
        }
        Insert: {
          assets?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          compatibility?: Json | null
          createdAt: string
          createdAtZ?: string | null
          description: string
          files?: Json | null
          id: string
          instructions: string
          license?: string | null
          metadata?: Json | null
          name: string
          references?: Json | null
          scripts?: Json | null
          skillId: string
          source?: Json | null
          tree?: Json | null
          versionNumber: number
        }
        Update: {
          assets?: Json | null
          changedFields?: Json | null
          changeMessage?: string | null
          compatibility?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          description?: string
          files?: Json | null
          id?: string
          instructions?: string
          license?: string | null
          metadata?: Json | null
          name?: string
          references?: Json | null
          scripts?: Json | null
          skillId?: string
          source?: Json | null
          tree?: Json | null
          versionNumber?: number
        }
        Relationships: []
      }
      mastra_skills: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          favoriteCount: number | null
          id: string
          status: string
          updatedAt: string
          updatedAtZ: string | null
          visibility: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          favoriteCount?: number | null
          id: string
          status: string
          updatedAt: string
          updatedAtZ?: string | null
          visibility?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          favoriteCount?: number | null
          id?: string
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      mastra_threads: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          resourceId: string
          title: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          resourceId: string
          title: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          resourceId?: string
          title?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_tool_provider_connections: {
        Row: {
          authorId: string
          connectionId: string
          createdAt: string
          createdAtZ: string | null
          label: string | null
          providerId: string
          scope: string
          toolkit: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          authorId: string
          connectionId: string
          createdAt: string
          createdAtZ?: string | null
          label?: string | null
          providerId: string
          scope: string
          toolkit: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          authorId?: string
          connectionId?: string
          createdAt?: string
          createdAtZ?: string | null
          label?: string | null
          providerId?: string
          scope?: string
          toolkit?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_workflow_snapshot: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          resourceId: string | null
          run_id: string
          snapshot: Json
          updatedAt: string
          updatedAtZ: string | null
          workflow_name: string
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          resourceId?: string | null
          run_id: string
          snapshot: Json
          updatedAt: string
          updatedAtZ?: string | null
          workflow_name: string
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          resourceId?: string | null
          run_id?: string
          snapshot?: Json
          updatedAt?: string
          updatedAtZ?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      mastra_workspace_versions: {
        Row: {
          autoSync: boolean | null
          changedFields: Json | null
          changeMessage: string | null
          createdAt: string
          createdAtZ: string | null
          description: string | null
          filesystem: Json | null
          id: string
          mounts: Json | null
          name: string
          operationTimeout: number | null
          sandbox: Json | null
          search: Json | null
          skills: Json | null
          tools: Json | null
          versionNumber: number
          workspaceId: string
        }
        Insert: {
          autoSync?: boolean | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt: string
          createdAtZ?: string | null
          description?: string | null
          filesystem?: Json | null
          id: string
          mounts?: Json | null
          name: string
          operationTimeout?: number | null
          sandbox?: Json | null
          search?: Json | null
          skills?: Json | null
          tools?: Json | null
          versionNumber: number
          workspaceId: string
        }
        Update: {
          autoSync?: boolean | null
          changedFields?: Json | null
          changeMessage?: string | null
          createdAt?: string
          createdAtZ?: string | null
          description?: string | null
          filesystem?: Json | null
          id?: string
          mounts?: Json | null
          name?: string
          operationTimeout?: number | null
          sandbox?: Json | null
          search?: Json | null
          skills?: Json | null
          tools?: Json | null
          versionNumber?: number
          workspaceId?: string
        }
        Relationships: []
      }
      mastra_workspaces: {
        Row: {
          activeVersionId: string | null
          authorId: string | null
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          status: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          status: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          activeVersionId?: string | null
          authorId?: string | null
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          id: string
          limits: Json
          name: string
          slug: string
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          limits?: Json
          name: string
          slug: string
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          limits?: Json
          name?: string
          slug?: string
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      practice_messages: {
        Row: {
          created_at: string
          id: string
          interrupted: boolean
          is_partial: boolean
          is_transcription: boolean
          role: string
          session_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id: string
          interrupted?: boolean
          is_partial?: boolean
          is_transcription?: boolean
          role: string
          session_id: string
          text?: string
        }
        Update: {
          created_at?: string
          id?: string
          interrupted?: boolean
          is_partial?: boolean
          is_transcription?: boolean
          role?: string
          session_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_session_documents: {
        Row: {
          added_at: string
          byte_size: number | null
          category: string
          content_base64: string | null
          id: string
          mime_type: string
          name: string
          practice_key: string | null
          session_id: string
          storage_path: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string
          byte_size?: number | null
          category: string
          content_base64?: string | null
          id: string
          mime_type: string
          name: string
          practice_key?: string | null
          session_id: string
          storage_path?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string
          byte_size?: number | null
          category?: string
          content_base64?: string | null
          id?: string
          mime_type?: string
          name?: string
          practice_key?: string | null
          session_id?: string
          storage_path?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_session_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          coaching_report: Json | null
          created_at: string
          difficulty: string
          evaluation: Json | null
          goal: string
          id: string
          practice_key: string | null
          setup: Json | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string | null
          worker_slug: string
          workspace_id: string | null
        }
        Insert: {
          coaching_report?: Json | null
          created_at?: string
          difficulty: string
          evaluation?: Json | null
          goal: string
          id: string
          practice_key?: string | null
          setup?: Json | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
          worker_slug?: string
          workspace_id?: string | null
        }
        Update: {
          coaching_report?: Json | null
          created_at?: string
          difficulty?: string
          evaluation?: Json | null
          goal?: string
          id?: string
          practice_key?: string | null
          setup?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          worker_slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "practice_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_workspaces: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          platform_workspace_id: string | null
          practice_key: string | null
          settings: Json
          updated_at: string
          user_id: string | null
          visitor_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          practice_key?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform_workspace_id?: string | null
          practice_key?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_workspaces_platform_workspace_id_fkey"
            columns: ["platform_workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_enrich_jobs: {
        Row: {
          context: Json | null
          created_at: string
          error: string | null
          id: string
          progress: string | null
          session_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error?: string | null
          id: string
          progress?: string | null
          session_id: string
          source?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          progress?: string | null
          session_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_summary_jobs: {
        Row: {
          coaching_report: Json | null
          created_at: string
          error: string | null
          id: string
          progress: string | null
          session_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          coaching_report?: Json | null
          created_at?: string
          error?: string | null
          id: string
          progress?: string | null
          session_id: string
          source?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          coaching_report?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          progress?: string | null
          session_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      stylist_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          title: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_mem0_memory_refs: {
        Row: {
          category: string | null
          content_preview: string | null
          created_at: string
          id: string
          is_active: boolean
          mem0_memory_id: string
          source_id: string | null
          source_type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content_preview?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mem0_memory_id: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          content_preview?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mem0_memory_id?: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_mem0_memory_refs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_mem0_sync: {
        Row: {
          created_at: string
          error_message: string | null
          last_synced_at: string | null
          mem0_agent_id: string | null
          mem0_user_id: string
          sync_status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          last_synced_at?: string | null
          mem0_agent_id?: string | null
          mem0_user_id: string
          sync_status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          last_synced_at?: string | null
          mem0_agent_id?: string | null
          mem0_user_id?: string
          sync_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_mem0_sync_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_memory_summaries: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content?: Json
          id?: string
          section: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_memory_summaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          token_count: number | null
          workspace_id: string | null
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          token_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          token_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "stylist_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_outfit_generations: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          intent: string | null
          message_id: string | null
          model_config: Json
          prompt_context: Json | null
          status: string
          stylist_pick_id: string | null
          user_id: string | null
          user_prompt: string | null
          wardrobe_id: string | null
          workspace_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          message_id?: string | null
          model_config?: Json
          prompt_context?: Json | null
          status?: string
          stylist_pick_id?: string | null
          user_id?: string | null
          user_prompt?: string | null
          wardrobe_id?: string | null
          workspace_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          message_id?: string | null
          model_config?: Json
          prompt_context?: Json | null
          status?: string
          stylist_pick_id?: string | null
          user_id?: string | null
          user_prompt?: string | null
          wardrobe_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_outfit_generations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "stylist_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_outfit_generations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "stylist_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_outfit_generations_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "stylist_wardrobes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_outfit_generations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_outfit_look_items: {
        Row: {
          look_id: string
          sort_order: number
          wardrobe_item_id: string
        }
        Insert: {
          look_id: string
          sort_order?: number
          wardrobe_item_id: string
        }
        Update: {
          look_id?: string
          sort_order?: number
          wardrobe_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_outfit_look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "stylist_outfit_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_outfit_look_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "stylist_wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_outfit_looks: {
        Row: {
          created_at: string
          feedback: string | null
          generation_id: string
          id: string
          image_id: string | null
          is_stylist_pick: boolean
          occasion_tag: string | null
          rationale: string
          storage_path: string
          vibe: string | null
          wardrobe_item_ids: string[] | null
          worn_at: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          generation_id: string
          id?: string
          image_id?: string | null
          is_stylist_pick?: boolean
          occasion_tag?: string | null
          rationale?: string
          storage_path: string
          vibe?: string | null
          wardrobe_item_ids?: string[] | null
          worn_at?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          generation_id?: string
          id?: string
          image_id?: string | null
          is_stylist_pick?: boolean
          occasion_tag?: string | null
          rationale?: string
          storage_path?: string
          vibe?: string | null
          wardrobe_item_ids?: string[] | null
          worn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_outfit_looks_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "stylist_outfit_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_outfit_looks_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "stylist_uploaded_images"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_preference_signals: {
        Row: {
          created_at: string
          id: string
          payload: Json
          signal_type: string
          source_look_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          signal_type: string
          source_look_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          signal_type?: string
          source_look_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_preference_signals_source_look_id_fkey"
            columns: ["source_look_id"]
            isOneToOne: false
            referencedRelation: "stylist_outfit_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_preference_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_uploaded_images: {
        Row: {
          byte_size: number | null
          content_hash: string | null
          created_at: string
          deleted_at: string | null
          height: number | null
          id: string
          mime_type: string
          source: string
          status: string
          storage_path: string
          thumb_path: string | null
          user_id: string | null
          vision: Json
          width: number | null
          workspace_id: string
        }
        Insert: {
          byte_size?: number | null
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          mime_type?: string
          source?: string
          status?: string
          storage_path: string
          thumb_path?: string | null
          user_id?: string | null
          vision?: Json
          width?: number | null
          workspace_id: string
        }
        Update: {
          byte_size?: number | null
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          mime_type?: string
          source?: string
          status?: string
          storage_path?: string
          thumb_path?: string | null
          user_id?: string | null
          vision?: Json
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_uploaded_images_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_wardrobe_items: {
        Row: {
          category: string | null
          colors: string[] | null
          created_at: string
          description: string
          formality: string | null
          id: string
          image_id: string | null
          metadata: Json | null
          status: string
          storage_path: string
          thumb_path: string | null
          updated_at: string
          user_id: string | null
          wardrobe_id: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string
          formality?: string | null
          id?: string
          image_id?: string | null
          metadata?: Json | null
          status?: string
          storage_path: string
          thumb_path?: string | null
          updated_at?: string
          user_id?: string | null
          wardrobe_id?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string
          formality?: string | null
          id?: string
          image_id?: string | null
          metadata?: Json | null
          status?: string
          storage_path?: string
          thumb_path?: string | null
          updated_at?: string
          user_id?: string | null
          wardrobe_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_wardrobe_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "stylist_uploaded_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_wardrobe_items_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "stylist_wardrobes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_wardrobe_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_wardrobes: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          item_count: number
          name: string
          slug: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          item_count?: number
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          item_count?: number
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_wardrobes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "stylist_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_workspaces: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_default: boolean
          name: string
          onboarding_complete: boolean
          platform_workspace_id: string | null
          settings: Json
          updated_at: string
          user_id: string | null
          visitor_token: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_default?: boolean
          name?: string
          onboarding_complete?: boolean
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_default?: boolean
          name?: string
          onboarding_complete?: boolean
          platform_workspace_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_workspaces_platform_workspace_id_fkey"
            columns: ["platform_workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          action_type: string
          cost: number
          created_at: string
          id: string
          metadata: Json | null
          tokens_input: number
          tokens_output: number
          user_id: string
          worker_slug: string
        }
        Insert: {
          action_type: string
          cost?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          tokens_input?: number
          tokens_output?: number
          user_id: string
          worker_slug: string
        }
        Update: {
          action_type?: string
          cost?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          tokens_input?: number
          tokens_output?: number
          user_id?: string
          worker_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_worker_slug_fkey"
            columns: ["worker_slug"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["slug"]
          },
        ]
      }
      worker_composio_sessions: {
        Row: {
          created_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_conversations: {
        Row: {
          created_at: string
          id: string
          mem0_digest_message_count: number
          mem0_last_captured_message_id: string | null
          mem0_last_digest_at: string | null
          model: string | null
          title: string | null
          updated_at: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mem0_digest_message_count?: number
          mem0_last_captured_message_id?: string | null
          mem0_last_digest_at?: string | null
          model?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mem0_digest_message_count?: number
          mem0_last_captured_message_id?: string | null
          mem0_last_digest_at?: string | null
          model?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          worker_slug?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_conversations_mem0_last_captured_message_id_fkey"
            columns: ["mem0_last_captured_message_id"]
            isOneToOne: false
            referencedRelation: "worker_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_file_chunk_embeddings: {
        Row: {
          chunk_id: string
          created_at: string
          dimensions: number
          embedding: string
          id: string
          model: string
        }
        Insert: {
          chunk_id: string
          created_at?: string
          dimensions?: number
          embedding: string
          id?: string
          model: string
        }
        Update: {
          chunk_id?: string
          created_at?: string
          dimensions?: number
          embedding?: string
          id?: string
          model?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_file_chunk_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "worker_file_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_file_chunks: {
        Row: {
          char_count: number
          chunk_index: number
          content: string | null
          created_at: string
          file_id: string
          id: string
          metadata: Json
          modality: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Insert: {
          char_count?: number
          chunk_index: number
          content?: string | null
          created_at?: string
          file_id: string
          id?: string
          metadata?: Json
          modality: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Update: {
          char_count?: number
          chunk_index?: number
          content?: string | null
          created_at?: string
          file_id?: string
          id?: string
          metadata?: Json
          modality?: string
          user_id?: string
          worker_slug?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_file_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "worker_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_file_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_files: {
        Row: {
          byte_size: number | null
          content_type: string | null
          conversation_id: string | null
          created_at: string
          error_message: string | null
          filename: string
          id: string
          metadata: Json
          processed_at: string | null
          status: string
          storage_bucket: string
          storage_path: string
          user_id: string
          worker_slug: string
          workspace_id: string | null
        }
        Insert: {
          byte_size?: number | null
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          metadata?: Json
          processed_at?: string | null
          status?: string
          storage_bucket: string
          storage_path: string
          user_id: string
          worker_slug: string
          workspace_id?: string | null
        }
        Update: {
          byte_size?: number | null
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          metadata?: Json
          processed_at?: string | null
          status?: string
          storage_bucket?: string
          storage_path?: string
          user_id?: string
          worker_slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_files_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "worker_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          parts: Json
          role: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          parts?: Json
          role: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          parts?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "worker_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_workspace_memory: {
        Row: {
          created_at: string
          id: string
          memory_key: string
          memory_value: string
          source: string
          updated_at: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_key: string
          memory_value: string
          source?: string
          updated_at?: string
          user_id: string
          worker_slug: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_key?: string
          memory_value?: string
          source?: string
          updated_at?: string
          user_id?: string
          worker_slug?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_workspace_memory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_workspace_settings: {
        Row: {
          advisor_style: string | null
          business_name: string | null
          country_code: string | null
          created_at: string
          current_challenge: string | null
          current_goal: string | null
          custom_instructions: string | null
          explanation_level: string | null
          industry: string | null
          primary_focus: string
          response_length: string | null
          revenue_range: string | null
          team_size: string | null
          updated_at: string
          user_id: string
          user_role: string | null
          worker_slug: string
          workspace_id: string
        }
        Insert: {
          advisor_style?: string | null
          business_name?: string | null
          country_code?: string | null
          created_at?: string
          current_challenge?: string | null
          current_goal?: string | null
          custom_instructions?: string | null
          explanation_level?: string | null
          industry?: string | null
          primary_focus?: string
          response_length?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
          worker_slug: string
          workspace_id: string
        }
        Update: {
          advisor_style?: string | null
          business_name?: string | null
          country_code?: string | null
          created_at?: string
          current_challenge?: string | null
          current_goal?: string | null
          custom_instructions?: string | null
          explanation_level?: string | null
          industry?: string | null
          primary_focus?: string
          response_length?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
          worker_slug?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "worker_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          worker_slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          worker_slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          worker_slug?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          created_at: string
          name: string
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          name: string
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          name?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_workspace_file_chunks: {
        Args: {
          match_count?: number
          match_workspace_id: string
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          file_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
