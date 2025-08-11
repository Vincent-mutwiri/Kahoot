import React, { useState } from 'react';
import { useQuestions, useAddQuestion, useUpdateQuestion, useDeleteQuestion } from '../helpers/questionQueries';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { AlertTriangle, CheckCircle, Edit, Plus, Trash2, XCircle } from 'lucide-react';
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
}> = ({ question, isPlayed, onEdit, onDelete }) => {
  return (
    <div className={styles.questionItem}>
      <div className={styles.questionHeader}>
        <div className={styles.questionTitle}>
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
        {sortedQuestions.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            isPlayed={currentQuestionIndex !== null && q.questionIndex <= currentQuestionIndex}
            onEdit={() => setEditingQuestion(q)}
            onDelete={() => setDeletingQuestion(q)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Question Bank</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
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
            />
          </DialogContent>
        </Dialog>
      </div>
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
    </div>
  );
};