import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LogIn, PlusCircle, Crown } from 'lucide-react';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from '../components/Form';
import { Separator } from '../components/Separator';
import { Spinner } from '../components/Spinner';
import { useCreateGame, useJoinGame } from '../helpers/gameQueries';
import { schema as createGameSchema } from '../endpoints/game/create_POST.schema';
import { schema as joinGameSchema } from '../endpoints/game/join_POST.schema';

import styles from './_index.module.css';

const HOST_NAME_STORAGE_KEY = 'lps_host_name';

const JoinGameForm = () => {
  const navigate = useNavigate();
  const joinGameMutation = useJoinGame();

  const form = useForm({
    schema: joinGameSchema,
    defaultValues: {
      gameCode: '',
      username: '',
    },
  });

  const onSubmit = (values: z.infer<typeof joinGameSchema>) => {
    joinGameMutation.mutate(values, {
      onSuccess: () => {
        toast.success(`Welcome, ${values.username}! Joining game...`);
        navigate(`/game/${values.gameCode}`);
      },
      onError: (error) => {
        if (error instanceof Error) {
          toast.error(`Failed to join game: ${error.message}`);
        } else {
          toast.error('An unknown error occurred.');
        }
        console.error("Join game error:", error);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <FormItem name="gameCode">
          <FormLabel>Game Code</FormLabel>
          <FormControl>
            <Input
              placeholder="ABC123"
              value={form.values.gameCode}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, gameCode: e.target.value.toUpperCase() }))
              }
              maxLength={6}
              className={styles.codeInput}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem name="username">
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input
              placeholder="Your Name"
              value={form.values.username}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, username: e.target.value }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <Button type="submit" size="lg" disabled={joinGameMutation.isPending} className={styles.formButton}>
          {joinGameMutation.isPending ? <Spinner size="sm" /> : <LogIn size={20} />}
          Join Game
        </Button>
      </form>
    </Form>
  );
};

const CreateGameForm = () => {
  const navigate = useNavigate();
  const createGameMutation = useCreateGame();

  const form = useForm({
    schema: createGameSchema,
    defaultValues: {
      hostName: '',
      initialPrizePot: 100,
      prizePotIncrement: 50,
    },
  });

  const onSubmit = (values: z.infer<typeof createGameSchema>) => {
    createGameMutation.mutate(values, {
      onSuccess: (data) => {
        // Store host name in localStorage for dashboard access
        localStorage.setItem(HOST_NAME_STORAGE_KEY, values.hostName);
        toast.success('Game created successfully! Redirecting to host dashboard...');
        navigate(`/host/${data.code}`);
      },
      onError: (error) => {
        if (error instanceof Error) {
          toast.error(`Failed to create game: ${error.message}`);
        } else {
          toast.error('An unknown error occurred.');
        }
        console.error("Create game error:", error);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <FormItem name="hostName">
          <FormLabel>Host Name</FormLabel>
          <FormControl>
            <Input
              placeholder="Game Master"
              value={form.values.hostName}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, hostName: e.target.value }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <div className={styles.prizeInputs}>
          <FormItem name="initialPrizePot">
            <FormLabel>Initial Pot ($)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="100"
                value={form.values.initialPrizePot}
                onChange={(e) =>
                  form.setValues((prev) => ({
                    ...prev,
                    initialPrizePot: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="prizePotIncrement">
            <FormLabel>Increment/Round ($)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="50"
                value={form.values.prizePotIncrement}
                onChange={(e) =>
                  form.setValues((prev) => ({
                    ...prev,
                    prizePotIncrement: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
        <Button type="submit" size="lg" disabled={createGameMutation.isPending} className={styles.formButton}>
          {createGameMutation.isPending ? <Spinner size="sm" /> : <PlusCircle size={20} />}
          Create Game
        </Button>
      </form>
    </Form>
  );
};

const HostDashboardAccess = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = React.useState('');
  const hostName = localStorage.getItem(HOST_NAME_STORAGE_KEY);

  if (!hostName) return null;

  const handleAccessDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim()) {
      navigate(`/host/${gameCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className={styles.hostAccess}>
      <h3 className={styles.hostAccessTitle}>
        <Crown size={20} />
        Welcome back, {hostName}
      </h3>
      <form onSubmit={handleAccessDashboard} className={styles.hostAccessForm}>
        <Input
          placeholder="Enter game code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value.toUpperCase())}
          maxLength={6}
          className={styles.codeInput}
        />
        <Button type="submit" disabled={!gameCode.trim()}>
          Access Dashboard
        </Button>
      </form>
    </div>
  );
};

const IndexPage = () => {
  return (
    <>
      <Helmet>
        <title>Last Player Standing | Join or Create a Game</title>
        <meta name="description" content="The main entry point for the Last Player Standing game. Join an existing game or create a new one as a host." />
      </Helmet>
      <main className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>LAST PLAYER STANDING</h1>
          <p className={styles.subtitle}>The ultimate high-stakes trivia game. Will you survive?</p>
        </div>

        <HostDashboardAccess />

        <div className={styles.actionsContainer}>
          <div className={styles.actionCard}>
            <h2 className={styles.cardTitle}>
              <LogIn className={styles.cardIcon} />
              Join a Game
            </h2>
            <p className={styles.cardDescription}>Enter a game code and your username to join the battle.</p>
            <JoinGameForm />
          </div>

          <Separator orientation="vertical" className={styles.separator} />

          <div className={styles.actionCard}>
            <h2 className={styles.cardTitle}>
              <Crown className={styles.cardIcon} />
              Host a Game
            </h2>
            <p className={styles.cardDescription}>Create a new game, set the stakes, and control the chaos.</p>
            <CreateGameForm />
          </div>
        </div>
      </main>
    </>
  );
};

export default IndexPage;