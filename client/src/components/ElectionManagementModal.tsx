
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, Users, Calendar, Save, AlertCircle } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  bio: string;
  photo?: string;
}

interface Position {
  id: string;
  title: string;
  maxVotes: number;
  candidates: Candidate[];
}

interface ElectionData {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  positions: Position[];
}

interface ElectionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  election?: ElectionData | null;
  onSave?: (electionData: ElectionData) => void;
  isSubmitting?: boolean;
}

export default function ElectionManagementModal({ 
  isOpen, 
  onClose, 
  election, 
  onSave, 
  isSubmitting 
}: ElectionManagementModalProps) {
  const [formData, setFormData] = useState<ElectionData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    positions: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (election) {
      setFormData({
        id: election.id,
        title: election.title,
        description: election.description,
        startDate: election.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: election.endDate.split('T')[0],
        positions: election.positions
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        positions: []
      });
    }
    setErrors({});
  }, [election, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.positions.length === 0) {
      newErrors.positions = 'At least one position is required';
    }
    
    formData.positions.forEach((position, index) => {
      if (!position.title.trim()) {
        newErrors[`position_${index}_title`] = 'Position title is required';
      }
      if (position.candidates.length < 2) {
        newErrors[`position_${index}_candidates`] = 'At least 2 candidates required per position';
      }
      position.candidates.forEach((candidate, candidateIndex) => {
        if (!candidate.name.trim()) {
          newErrors[`candidate_${index}_${candidateIndex}_name`] = 'Candidate name is required';
        }
        if (!candidate.bio.trim()) {
          newErrors[`candidate_${index}_${candidateIndex}_bio`] = 'Candidate bio is required';
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const electionData: ElectionData = {
      ...formData,
      startDate: `${formData.startDate}T00:00:00Z`,
      endDate: `${formData.endDate}T23:59:59Z`
    };
    
    onSave?.(electionData);
  };

  const addPosition = () => {
    const newPosition: Position = {
      id: `pos_${Date.now()}`,
      title: '',
      maxVotes: 1,
      candidates: []
    };
    
    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));
  };

  const removePosition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  };

  const updatePosition = (index: number, field: keyof Position, value: any) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === index ? { ...pos, [field]: value } : pos
      )
    }));
  };

  const addCandidate = (positionIndex: number) => {
    const newCandidate: Candidate = {
      id: `cand_${Date.now()}`,
      name: '',
      bio: ''
    };
    
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === positionIndex 
          ? { ...pos, candidates: [...pos.candidates, newCandidate] }
          : pos
      )
    }));
  };

  const removeCandidate = (positionIndex: number, candidateIndex: number) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === positionIndex 
          ? { ...pos, candidates: pos.candidates.filter((_, ci) => ci !== candidateIndex) }
          : pos
      )
    }));
  };

  const updateCandidate = (positionIndex: number, candidateIndex: number, field: keyof Candidate, value: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === positionIndex 
          ? { 
              ...pos, 
              candidates: pos.candidates.map((cand, ci) => 
                ci === candidateIndex ? { ...cand, [field]: value } : cand
              )
            }
          : pos
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {election ? 'Edit Election' : 'Create New Election'}
          </DialogTitle>
          <DialogDescription>
            {election ? 'Modify election details and positions.' : 'Set up a new election with positions and candidates.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Election Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Election Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Student Council Elections 2025"
                    data-testid="input-election-title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Annual election for student government representatives"
                    data-testid="textarea-election-description"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    data-testid="input-start-date"
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    data-testid="input-end-date"
                  />
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Positions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Positions & Candidates</CardTitle>
              <Button onClick={addPosition} size="sm" data-testid="button-add-position">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.positions && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.positions}</AlertDescription>
                </Alert>
              )}
              
              {formData.positions.map((position, positionIndex) => (
                <Card key={position.id} className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={position.title}
                        onChange={(e) => updatePosition(positionIndex, 'title', e.target.value)}
                        placeholder="Position Title (e.g., President)"
                        data-testid={`input-position-title-${positionIndex}`}
                      />
                      {errors[`position_${positionIndex}_title`] && (
                        <p className="text-sm text-destructive">{errors[`position_${positionIndex}_title`]}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePosition(positionIndex)}
                      data-testid={`button-remove-position-${positionIndex}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {errors[`position_${positionIndex}_candidates`] && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors[`position_${positionIndex}_candidates`]}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Candidates</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCandidate(positionIndex)}
                        data-testid={`button-add-candidate-${positionIndex}`}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add Candidate
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {position.candidates.map((candidate, candidateIndex) => (
                        <div key={candidate.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <Input
                                  value={candidate.name}
                                  onChange={(e) => updateCandidate(positionIndex, candidateIndex, 'name', e.target.value)}
                                  placeholder="Candidate Name"
                                  data-testid={`input-candidate-name-${positionIndex}-${candidateIndex}`}
                                />
                                {errors[`candidate_${positionIndex}_${candidateIndex}_name`] && (
                                  <p className="text-xs text-destructive mt-1">
                                    {errors[`candidate_${positionIndex}_${candidateIndex}_name`]}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Textarea
                                  value={candidate.bio}
                                  onChange={(e) => updateCandidate(positionIndex, candidateIndex, 'bio', e.target.value)}
                                  placeholder="Candidate Biography"
                                  rows={2}
                                  data-testid={`textarea-candidate-bio-${positionIndex}-${candidateIndex}`}
                                />
                                {errors[`candidate_${positionIndex}_${candidateIndex}_bio`] && (
                                  <p className="text-xs text-destructive mt-1">
                                    {errors[`candidate_${positionIndex}_${candidateIndex}_bio`]}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCandidate(positionIndex, candidateIndex)}
                              data-testid={`button-remove-candidate-${positionIndex}-${candidateIndex}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {formData.positions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No positions added yet. Click "Add Position" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
              data-testid="button-cancel-election"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
              data-testid="button-save-election"
            >
              {isSubmitting ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {election ? 'Update Election' : 'Create Election'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
