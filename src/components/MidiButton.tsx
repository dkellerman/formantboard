import { useEffect, type ReactNode } from "react";
import { MidiStatus } from "@/constants";
import { note2freq, type Note } from "@/utils";
import { useMidi } from "@/hooks/useMidi";
import { usePlayer } from "@/hooks/usePlayer";
import { cn } from "@/lib/cn";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface MidiButtonProps {
  showButton?: boolean;
  text?: string;
  onNoteOn?: (note: Note, velocity: number) => void;
  onNoteOff?: (note: Note) => void;
  className?: string;
  buttonClassName?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  icon?: ReactNode;
  hideText?: boolean;
  title?: string;
  ariaLabel?: string;
}

export function MidiButton({
  showButton = true,
  onNoteOn,
  onNoteOff,
  text = "Enable MIDI",
  className,
  buttonClassName,
  buttonVariant = "outline",
  buttonSize,
  icon,
  hideText = false,
  title,
  ariaLabel,
}: MidiButtonProps) {
  const midi = useMidi();
  const player = usePlayer();

  async function enableMidi() {
    await midi.enable();

    midi.addNoteOnListener((note: Note, velocity: number) => {
      if (onNoteOn) onNoteOn(note, velocity);
      else player.play(note2freq(note), velocity);
    });

    midi.addNoteOffListener((note: Note) => {
      if (onNoteOff) onNoteOff(note);
      else player.stop(note2freq(note));
    });
  }

  useEffect(() => {
    return () => {
      midi.disable();
    };
  }, [midi]);

  if (!showButton || midi.status !== MidiStatus.Disabled) {
    return <section className="midi" />;
  }

  return (
    <section className={cn("midi", className)}>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={cn(buttonClassName)}
        onClick={enableMidi}
        title={title ?? text}
        aria-label={ariaLabel ?? text}
      >
        {icon}
        {text ? (
          hideText ? (
            <span className={cn("sr-only")}>{text}</span>
          ) : (
            <span>{text}</span>
          )
        ) : null}
      </Button>
    </section>
  );
}
