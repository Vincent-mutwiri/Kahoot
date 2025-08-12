import React, { useState } from 'react';
import { useQuestions, useAddQuestion, useUpdateQuestion, useDeleteQuestion } from '../helpers/questionQueries';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { AlertTriangle, CheckCircle, Edit, Plus, Trash2, XCircle, Download } from 'lucide-react';
import styles from './QuestionManager.module.css';
import type { Selectable } from 'kysely';
import type { Games, Questions } from '../helpers/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from './Dialog';
import { QuestionForm } from './QuestionForm';
import { z } from 'zod';
import { schema as addQuestionSchema } from '../endpoints/question/add_POST.schema';
import { Separator } from './Separator';
import { Badge } from './Badge';
import { toast } from 'sonner';

type Question = Selectable<Questions>;
type GameStatus = Selectable<Games>['status'];

interface QuestionManagerProps {
  gameCode: string;
  hostName: string;
  currentQuestionIndex: number | null;
  gameStatus: GameStatus;
  className?: string;
}

const addFormSchema = addQuestionSchema.omit({ gameCode: true, hostName: true });
type AddFormValues = z.infer<typeof addFormSchema>;

// Utility function to safely map database Question to form values
const questionToFormValues = (question: Question): Partial<AddFormValues> => {
  const validAnswers = ['A', 'B', 'C', 'D'] as const;
  const correctAnswer = validAnswers.includes(question.correctAnswer as any) 
    ? question.correctAnswer as 'A' | 'B' | 'C' | 'D'
    : 'A'; // fallback to 'A' if somehow invalid data exists

  return {
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer,
  };
};

const QuestionItem: React.FC<{
  question: Question;
  isPlayed: boolean;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (questionId: number) => void;
}> = ({ question, isPlayed, onEdit, onDelete, selectionMode, isSelected, onSelect }) => {
  return (
    <div className={`${styles.questionItem} ${isSelected ? styles.selectedQuestion : ''}`}>
      <div className={styles.questionHeader}>
        <div className={styles.questionTitle}>
          {selectionMode && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => {
                e.stopPropagation();
                onSelect?.(question._id);
              }}
              className={styles.questionCheckbox}
            />
          )}
          <span className={styles.questionIndex}>Q{question.questionIndex + 1}</span>
          <p>{question.questionText}</p>
        </div>
        <div className={styles.questionActions}>
          {isPlayed ? (
            <Badge variant="success">Played</Badge>
          ) : (
            <>
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(question)} aria-label="Edit question">
                <Edit size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete(question)} aria-label="Delete question">
                <Trash2 size={16} className={styles.deleteIcon} />
              </Button>
            </>
          )}
          {question.isGlobal && (
            <Badge variant="secondary">Global</Badge>
          )}
        </div>
      </div>
      <div className={styles.optionsGrid}>
        {[
          { key: 'A', text: question.optionA },
          { key: 'B', text: question.optionB },
          { key: 'C', text: question.optionC },
          { key: 'D', text: question.optionD },
        ].map((opt) => (
          <div
            key={opt.key}
            className={`${styles.option} ${question.correctAnswer === opt.key ? styles.correctOption : ''}`}
          >
            {question.correctAnswer === opt.key ? (
              <CheckCircle size={16} className={styles.correctIcon} />
            ) : (
              <XCircle size={16} className={styles.incorrectIcon} />
            )}
            <span className={styles.optionKey}>{opt.key}:</span>
            <span>{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestionManagerSkeleton: React.FC = () => (
  <div className={styles.skeletonContainer}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={styles.skeletonItem}>
        <div className={styles.skeletonHeader}>
          <Skeleton style={{ height: '1.5rem', width: '70%' }} />
          <Skeleton style={{ height: '2rem', width: '5rem' }} />
        </div>
        <div className={styles.skeletonOptions}>
          <Skeleton style={{ height: '1.25rem', width: '45%' }} />
          <Skeleton style={{ height: '1.25rem', width: '45%' }} />
          <Skeleton style={{ height: '1.25rem', width: '45%' }} />
          <Skeleton style={{ height: '1.25rem', width: '45%' }} />
        </div>
      </div>
    ))}
  </div>
);

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  gameCode,
  hostName,
  currentQuestionIndex,
  gameStatus,
  className,
}) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [isGlobalBankOpen, setGlobalBankOpen] = useState(false);
  const [globalQuestions, setGlobalQuestions] = useState([]);
  const [selectedGlobalQuestions, setSelectedGlobalQuestions] = useState<string[]>([]);
  const [selectedGameQuestions, setSelectedGameQuestions] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const { data: questions, isFetching, error } = useQuestions({ gameCode, hostName });

  const addMutation = useAddQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const handleAddQuestion = (values: AddFormValues) => {
    addMutation.mutate(
      { ...values, gameCode, hostName },
      {
        onSuccess: () => {
          toast.success('Question added successfully!');
          setAddModalOpen(false);
        },
        onError: (err) => {
          if (err instanceof Error) {
            toast.error(`Failed to add question: ${err.message}`);
          }
        },
      },
    );
  };

  const handleUpdateQuestion = (values: AddFormValues) => {
    if (!editingQuestion) return;
    updateMutation.mutate(
      { ...values, gameCode, hostName, questionId: editingQuestion.id },
      {
        onSuccess: () => {
          toast.success('Question updated successfully!');
          setEditingQuestion(null);
        },
        onError: (err) => {
          if (err instanceof Error) {
            toast.error(`Failed to update question: ${err.message}`);
          }
        },
      },
    );
  };

  const handleDeleteQuestion = () => {
    if (!deletingQuestion) return;
    deleteMutation.mutate(
      { gameCode, hostName, questionId: deletingQuestion.id },
      {
        onSuccess: () => {
          toast.success('Question deleted successfully!');
          setDeletingQuestion(null);
        },
        onError: (err) => {
          if (err instanceof Error) {
            toast.error(`Failed to delete question: ${err.message}`);
          }
        },
      },
    );
  };

  const handleSaveToGlobal = async (values: AddFormValues) => {
    try {
      await fetch('/_api/questions/save-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, createdBy: hostName })
      });
      
      // Also save to game and mark as global
      addMutation.mutate(
        { ...values, gameCode, hostName, isGlobal: true },
        {
          onSuccess: () => {
            toast.success('Question saved to global bank and added to game!');
            setAddModalOpen(false);
          },
          onError: (err) => {
            toast.error('Saved to global but failed to add to game');
          },
        },
      );
    } catch (error) {
      toast.error('Failed to save to global bank');
    }
  };

  const loadGlobalQuestions = async () => {
    try {
      const response = await fetch('/_api/questions/global-list');
      const data = await response.json();
      setGlobalQuestions(data.questions);
    } catch (error) {
      toast.error('Failed to load global questions');
    }
  };

  const handleImportSelected = async () => {
    try {
      await fetch('/_api/questions/import-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode, hostName, questionIds: selectedGlobalQuestions })
      });
      toast.success(`Imported ${selectedGlobalQuestions.length} questions!`);
      setGlobalBankOpen(false);
      setSelectedGlobalQuestions([]);
    } catch (error) {
      toast.error('Failed to import questions');
    }
  };

  const sortedQuestions = questions ? [...questions].sort((a, b) => a.questionIndex - b.questionIndex) : [];

  const renderContent = () => {
    if (isFetching && !questions) {
      return <QuestionManagerSkeleton />;
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertTriangle size={48} />
          <h3>Error Loading Questions</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!sortedQuestions || sortedQuestions.length === 0) {
      return (
        <div className={styles.emptyState}>
          <h3>No Questions Yet</h3>
          <p>Get started by adding the first question for your game.</p>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Add First Question
          </Button>
        </div>
      );
    }

    return (
      <div className={styles.questionsList}>
        {sortedQuestions.map((q) => {
          const questionId = q._id;
          return (
            <QuestionItem
              key={questionId}
              question={q}
              isPlayed={currentQuestionIndex !== null && q.questionIndex <= currentQuestionIndex}
              onEdit={() => setEditingQuestion(q)}
              onDelete={() => setDeletingQuestion(q)}
              selectionMode={selectionMode}
              isSelected={selectedGameQuestions.includes(questionId)}
              onSelect={(id) => {
                if (id && selectedGameQuestions.includes(id)) {
                  setSelectedGameQuestions(prev => prev.filter(existingId => existingId !== id));
                } else if (id) {
                  setSelectedGameQuestions(prev => [...prev, id]);
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Question Bank</h2>
        <div className={styles.headerButtons}>
          <Button 
            onClick={() => setSelectionMode(!selectionMode)}
            variant={selectionMode ? "destructive" : "outline"}
            size="lg"
          >
            {selectionMode ? 'Cancel Selection' : 'Select Questions'}
          </Button>
          {selectionMode && (
            <Button 
              onClick={() => {
                if (selectedGameQuestions.length === sortedQuestions.length) {
                  setSelectedGameQuestions([]);
                } else {
                  setSelectedGameQuestions(sortedQuestions.map(q => q._id));
                }
              }}
              variant="secondary"
              size="sm"
            >
              {selectedGameQuestions.length === sortedQuestions.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          <Button 
            onClick={() => {
              console.log('Import Questions clicked');
              setGlobalBankOpen(true);
            }} 
            variant="secondary"
            size="lg"
          >
            <Download size={16} /> Import Questions
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus size={16} /> Add Question
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Question</DialogTitle>
              <DialogDescription>
                Craft a new challenge for your players. Make it a good one!
              </DialogDescription>
            </DialogHeader>
            <QuestionForm
              onSubmit={handleAddQuestion}
              onCancel={() => setAddModalOpen(false)}
              isSubmitting={addMutation.isPending}
              submitButtonText="Add Question"
              onSaveToGlobal={handleSaveToGlobal}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {selectionMode && selectedGameQuestions.length > 0 && (
        <div className={styles.selectionActions}>
          <span>{selectedGameQuestions.length} question{selectedGameQuestions.length !== 1 ? 's' : ''} selected</span>
          <div className={styles.actionButtons}>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                // Handle bulk delete
                console.log('Delete selected questions:', selectedGameQuestions);
              }}
            >
              Delete Selected
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const selectedQuestions = sortedQuestions.filter(q => selectedGameQuestions.includes(q._id));
                  for (const question of selectedQuestions) {
                    await fetch('/_api/questions/save-global', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        questionText: question.questionText,
                        answers: [question.optionA, question.optionB, question.optionC, question.optionD],
                        correctAnswerIndex: ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer),
                        createdBy: hostName
                      })
                    });
                  }
                  toast.success(`${selectedQuestions.length} questions saved to global bank!`);
                  setSelectedGameQuestions([]);
                  setSelectionMode(false);
                } catch (error) {
                  toast.error('Failed to save questions to global bank');
                }
              }}
            >
              Save to Global Bank
            </Button>
          </div>
        </div>
      )}
      <Separator />
      {renderContent()}

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(isOpen) => !isOpen && setEditingQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question {editingQuestion ? `#${editingQuestion.questionIndex + 1}` : ''}</DialogTitle>
            <DialogDescription>
              Refine the question details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm
              initialData={questionToFormValues(editingQuestion)}
              onSubmit={handleUpdateQuestion}
              onCancel={() => setEditingQuestion(null)}
              isSubmitting={updateMutation.isPending}
              submitButtonText="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingQuestion} onOpenChange={(isOpen) => !isOpen && setDeletingQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className={styles.dialogQuestionText}>
            "{deletingQuestion?.questionText}"
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingQuestion(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuestion} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Question Bank Dialog */}
      <Dialog open={isGlobalBankOpen} onOpenChange={(open) => { setGlobalBankOpen(open); if (open) loadGlobalQuestions(); }}>
        <DialogContent className={styles.globalBankDialog}>
          <DialogHeader>
            <DialogTitle>Global Question Bank</DialogTitle>
            <DialogDescription>
              Select questions from the global bank to import into your game.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.globalQuestionsList}>
            <div className={styles.selectAllContainer}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (selectedGlobalQuestions.length === globalQuestions.length) {
                    setSelectedGlobalQuestions([]);
                  } else {
                    setSelectedGlobalQuestions(globalQuestions.map((q: any) => q._id));
                  }
                }}
              >
                {selectedGlobalQuestions.length === globalQuestions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span>{selectedGlobalQuestions.length} of {globalQuestions.length} selected</span>
            </div>
            {globalQuestions.map((q: any, index: number) => (
              <div 
                key={q._id || `global-q-${index}`} 
                className={`${styles.globalQuestionItem} ${selectedGlobalQuestions.includes(q._id) ? styles.selected : ''}`}
                onClick={() => {
                  if (selectedGlobalQuestions.includes(q._id)) {
                    setSelectedGlobalQuestions(prev => prev.filter(id => id !== q._id));
                  } else {
                    setSelectedGlobalQuestions(prev => [...prev, q._id]);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedGlobalQuestions.includes(q._id)}
                  onChange={() => {}} // Handled by parent onClick
                />
                <div className={styles.questionContent}>
                  <h4>{q.questionText}</h4>
                  <div className={styles.questionMeta}>
                    <Badge variant="outline">{q.category}</Badge>
                    <Badge variant="secondary">{q.difficulty}</Badge>
                    <span>By: {q.createdBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGlobalBankOpen(false)}>Cancel</Button>
            <Button onClick={handleImportSelected} disabled={selectedGlobalQuestions.length === 0}>
              Import {selectedGlobalQuestions.length} Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};