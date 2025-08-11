import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GAME_INFO_QUERY_KEY } from "./gameQueries";

import { postGameStart, InputType as StartGameInput, OutputType as StartGameOutput } from "../endpoints/game/start_POST.schema";
import { postGameNextQuestion, InputType as NextQuestionInput, OutputType as NextQuestionOutput } from "../endpoints/game/next-question_POST.schema";
import { postGameRevealAnswer, InputType as RevealAnswerInput, OutputType as RevealAnswerOutput } from "../endpoints/game/reveal-answer_POST.schema";
import { postGameShowMedia, InputType as ShowMediaInput, OutputType as ShowMediaOutput } from "../endpoints/game/show-media_POST.schema";
import { postGameHideMedia, InputType as HideMediaInput, OutputType as HideMediaOutput } from "../endpoints/game/hide-media_POST.schema";
import { postGamePlaySound, InputType as PlaySoundInput, OutputType as PlaySoundOutput } from "../endpoints/game/play-sound_POST.schema";
import { postGameEnd, InputType as EndGameInput, OutputType as EndGameOutput } from "../endpoints/game/end_POST.schema";

const useHostMutation = <TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  getGameCode: (variables: TVariables) => string
) => {
  const queryClient = useQueryClient();
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      const gameCode = getGameCode(variables);
      // Invalidate both regular and realtime game info queries
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, gameCode] });
      queryClient.invalidateQueries({ queryKey: [GAME_INFO_QUERY_KEY, 'realtime', gameCode] });
    },
  });
};

export const useStartGame = () => useHostMutation<StartGameOutput, Error, StartGameInput>(postGameStart, v => v.gameCode);
export const useNextQuestion = () => useHostMutation<NextQuestionOutput, Error, NextQuestionInput>(postGameNextQuestion, v => v.gameCode);
export const useRevealAnswer = () => useHostMutation<RevealAnswerOutput, Error, RevealAnswerInput>(postGameRevealAnswer, v => v.gameCode);
export const useShowMedia = () => useHostMutation<ShowMediaOutput, Error, ShowMediaInput>(postGameShowMedia, v => v.gameCode);
export const useHideMedia = () => useHostMutation<HideMediaOutput, Error, HideMediaInput>(postGameHideMedia, v => v.gameCode);
export const usePlaySound = () => useHostMutation<PlaySoundOutput, Error, PlaySoundInput>(postGamePlaySound, v => v.gameCode);
export const useEndGame = () => useHostMutation<EndGameOutput, Error, EndGameInput>(postGameEnd, v => v.gameCode);