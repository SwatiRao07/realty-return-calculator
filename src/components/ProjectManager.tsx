import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, FolderOpen, Trash2, Plus, Database, FileText } from 'lucide-react';
import { ProjectData } from '@/types/project';
import { saveProject, getUserProjects, getProjectById, deleteProject } from '@/lib/firestoreService';

interface ProjectManagerProps {
  projectData: ProjectData;
  updateProjectData: (projectData: ProjectData) => void;
}

interface ProjectListItemProps {
  project: { id: string; projectName: string; updatedAt: any };
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProjectListItem = ({ project, onLoad, onDelete }: ProjectListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date if available
  let formattedDate = 'Unknown date';
  
  try {
    if (project.updatedAt) {
      // If it's already a Date object
      if (project.updatedAt instanceof Date) {
        formattedDate = project.updatedAt.toLocaleString();
        console.log('Date from Date object:', formattedDate);
      }
      // Handle Firestore timestamp object
      else if (typeof project.updatedAt === 'object' && project.updatedAt !== null) {
        if ('toDate' in project.updatedAt) {
          // Native Firestore timestamp
          formattedDate = project.updatedAt.toDate().toLocaleString();
          console.log('Date from Firestore timestamp:', formattedDate);
        } 
        else if ('seconds' in project.updatedAt) {
          // Handle serialized Firestore timestamp
          const seconds = typeof project.updatedAt.seconds === 'number' 
            ? project.updatedAt.seconds 
            : Number(project.updatedAt.seconds);
          const date = new Date(seconds * 1000);
          formattedDate = date.toLocaleString();
          console.log('Date from serialized timestamp:', formattedDate, 'Original seconds:', seconds);
        }
      } 
      // Handle string timestamp
      else if (typeof project.updatedAt === 'string') {
        formattedDate = new Date(project.updatedAt).toLocaleString();
        console.log('Date from string:', formattedDate);
      }
      // Handle number timestamp (milliseconds since epoch)
      else if (typeof project.updatedAt === 'number') {
        formattedDate = new Date(project.updatedAt).toLocaleString();
        console.log('Date from number:', formattedDate);
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Original value:', project.updatedAt);
    formattedDate = 'Invalid date format';
  }

  return (
    <div 
      className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onLoad(project.id)}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <div>
          <div className="font-medium">{project.projectName || 'Unnamed Project'}</div>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );
};

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projectData, updateProjectData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; projectName: string; updatedAt: any }>>([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [projectNameToSave, setProjectNameToSave] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const { toast } = useToast();

  // Load user's projects
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const userProjects = await getUserProjects();
      setProjects(userProjects.map(p => ({ 
        id: p.id as string, 
        projectName: p.projectName || 'Unnamed Project',
        updatedAt: p.updatedAt
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects when the component mounts or dialog opens
  useEffect(() => {
    if (isLoadDialogOpen) {
      fetchProjects();
    }
  }, [isLoadDialogOpen]);

  // Open save dialog to name the project
  const openSaveDialog = () => {
    setProjectNameToSave(projectData.projectName || 'New Project');
    setIsSaveDialogOpen(true);
  };

  // Handle saving current project
  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      // Update project data with the new name
      const updatedProjectData = {
        ...projectData,
        projectName: projectNameToSave.trim() || 'New Project'
      };
      
      // Save the current project data
      const projectId = await saveProject(updatedProjectData);
      
      // Update local state with the new ID and name
      updateProjectData({ 
        ...updatedProjectData, 
        id: projectId 
      });
      
      toast({
        title: 'Project Saved',
        description: `Project "${projectNameToSave}" has been saved successfully.`,
      });
      
      // Close the dialog
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: 'Failed to save project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle loading a project
  const handleLoadProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const loadedProject = await getProjectById(projectId);
      
      if (loadedProject) {
        updateProjectData(loadedProject);
        setIsLoadDialogOpen(false);
        
        toast({
          title: 'Project Loaded',
          description: `Project "${loadedProject.projectName || 'Unnamed Project'}" has been loaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      
      // Remove from local list
      setProjects(projects.filter(p => p.id !== projectId));
      
      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Create a new project
  const handleCreateNewProject = () => {
    const newProject: ProjectData = {
      projectName: newProjectName || 'New Project',
      annualInterestRate: 12,
      purchasePrice: 0,
      closingCosts: 0,
      renovationCosts: 0,
      salePrice: 0,
      saleMonth: 12,
      sellingCosts: 0,
      monthlyInterestRate: 1,
      discountRate: 10,
      payments: [],
      rentalIncome: [],
      operatingExpenses: []
    };
    
    updateProjectData(newProject);
    setNewProjectName('');
    setIsLoadDialogOpen(false);
    
    toast({
      title: 'New Project Created',
      description: `Project "${newProject.projectName}" has been created.`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Button 
        onClick={openSaveDialog} 
        disabled={isSaving}
        className="flex items-center gap-2"
        variant="outline"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : (projectData.id ? 'Save' : 'Save New')}
      </Button>
      
      {/* Load Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Open
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Open an existing project or create a new one
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Create New Project Section */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="New Project Name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateNewProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>
            
            {/* Existing Projects Section */}
            <div className="border rounded-md">
              <div className="p-3 bg-gray-50 border-b font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Your Projects
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No saved projects found</div>
                ) : (
                  projects.map(project => (
                    <ProjectListItem 
                      key={project.id} 
                      project={project} 
                      onLoad={handleLoadProject} 
                      onDelete={handleDeleteProject}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Save Project Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Enter a name for your project. This will help you identify it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="projectName">Project Name</Label>
            <Input 
              id="projectName" 
              value={projectNameToSave} 
              onChange={(e) => setProjectNameToSave(e.target.value)}
              placeholder="Enter project name"
              className="mt-2"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManager;
