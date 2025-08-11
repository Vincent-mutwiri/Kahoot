import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useJoinGame } from '../helpers/gameQueries';
import { Button } from './Button';
import { Spinner } from './Spinner';
import styles from './JoinGamePrompt.module.css';

const joinSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(20, "Username cannot exceed 20 characters"),
});

type JoinFormInputs = z.infer<typeof joinSchema>;

interface JoinGamePromptProps {
  gameCode: string;
  onJoin: (username: string) => void;
}

export const JoinGamePrompt: React.FC<JoinGamePromptProps> = ({ gameCode, onJoin }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<JoinFormInputs>({
    resolver: zodResolver(joinSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const joinGameMutation = useJoinGame();

  const onSubmit: SubmitHandler<JoinFormInputs> = async (data) => {
    setServerError(null);
    joinGameMutation.mutate({ gameCode, username: data.username }, {
      onSuccess: () => {
        onJoin(data.username);
      },
      onError: (error) => {
        if (error instanceof Error) {
          setServerError(error.message);
        } else {
          setServerError("An unknown error occurred.");
        }
        console.error("Failed to join game:", error);
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>JOIN GAME</h1>
        <p className={styles.gameCode}>
          Game Code: <span className={styles.code}>{gameCode}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Choose a Username</label>
            <input
              id="username"
              {...register("username")}
              className={styles.input}
              placeholder="Your cool name"
              autoComplete="off"
              disabled={joinGameMutation.isPending}
            />
            {errors.username && <p className={styles.fieldError}>{errors.username.message}</p>}
          </div>
          {serverError && <p className={styles.serverError}>{serverError}</p>}
          <Button type="submit" size="lg" disabled={joinGameMutation.isPending} className={styles.joinButton}>
            {joinGameMutation.isPending ? <Spinner size="sm" /> : 'Enter the Arena'}
          </Button>
        </form>
      </div>
    </div>
  );
};