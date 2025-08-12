import React from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Button } from './Button';
import { schema as addQuestionSchema } from '../endpoints/question/add_POST.schema';
import type { Selectable } from 'kysely';
import type { Questions } from '../helpers/schema';

// We can reuse the add schema and make some fields optional for update
const formSchema = addQuestionSchema.omit({ gameCode: true, hostName: true });
type FormValues = z.infer<typeof formSchema>;

interface QuestionFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
  onSaveToGlobal?: (data: FormValues) => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText = 'Save Question',
  onSaveToGlobal,
}) => {
  const form = useForm({
    schema: formSchema,
    defaultValues: {
      questionText: initialData?.questionText || '',
      optionA: initialData?.optionA || '',
      optionB: initialData?.optionB || '',
      optionC: initialData?.optionC || '',
      optionD: initialData?.optionD || '',
      correctAnswer: initialData?.correctAnswer || undefined,
    },
  });

  const { setValues, values } = form;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem name="questionText">
          <FormLabel>Question</FormLabel>
          <FormControl>
            <Textarea
              placeholder="What is the capital of France?"
              value={values.questionText}
              onChange={(e) => setValues((prev) => ({ ...prev, questionText: e.target.value }))}
              rows={3}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
          <FormItem name="optionA">
            <FormLabel>Option A</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Paris"
                value={values.optionA}
                onChange={(e) => setValues((prev) => ({ ...prev, optionA: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="optionB">
            <FormLabel>Option B</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., London"
                value={values.optionB}
                onChange={(e) => setValues((prev) => ({ ...prev, optionB: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="optionC">
            <FormLabel>Option C</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Berlin"
                value={values.optionC}
                onChange={(e) => setValues((prev) => ({ ...prev, optionC: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="optionD">
            <FormLabel>Option D</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Madrid"
                value={values.optionD}
                onChange={(e) => setValues((prev) => ({ ...prev, optionD: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="correctAnswer">
          <FormLabel>Correct Answer</FormLabel>
          <FormControl>
            <Select
              value={values.correctAnswer}
              onValueChange={(value) => {
                if (value === 'A' || value === 'B' || value === 'C' || value === 'D') {
                  setValues((prev) => ({ ...prev, correctAnswer: value }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the correct option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Option A</SelectItem>
                <SelectItem value="B">Option B</SelectItem>
                <SelectItem value="C">Option C</SelectItem>
                <SelectItem value="D">Option D</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-6)' }}>
          <div>
            {onSaveToGlobal && (
              <Button type="button" variant="outline" onClick={() => onSaveToGlobal(values)} disabled={isSubmitting}>
                Save to Global Bank
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitButtonText}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};