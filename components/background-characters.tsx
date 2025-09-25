"use client"

export default function BackgroundCharacters() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
      {/* Space Ranger (Buzz) - arriba izquierda */}
      <img
        src="/characters/space-ranger.png"
        alt=""
        draggable={false}
        className="absolute top-4 left-2 w-24 md:w-40 opacity-20 md:opacity-25 mix-blend-multiply rotate-[-6deg]"
      />
      {/* Cowboy hat (Toy Story) - arriba derecha */}
      <img
        src="/characters/cowboy-hat.png"
        alt=""
        draggable={false}
        className="absolute top-10 right-4 w-20 md:w-36 opacity-15 md:opacity-20 mix-blend-multiply rotate-[8deg]"
      />
      {/* Race car (Cars) - abajo izquierda */}
      <img
        src="/characters/race-car.png"
        alt=""
        draggable={false}
        className="absolute bottom-6 left-6 w-28 md:w-44 opacity-15 md:opacity-20 mix-blend-multiply"
      />
      {/* Star ball - abajo derecha */}
      <img
        src="/characters/ball.png"
        alt=""
        draggable={false}
        className="absolute bottom-10 right-6 w-16 md:w-28 opacity-20 md:opacity-25 mix-blend-multiply rotate-[12deg]"
      />
    </div>
  )
}
