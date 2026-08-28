import type { PredefinedExercise } from '../types/activity';

export const PREDEFINED_EXERCISES: PredefinedExercise[] = [
  // ── Chest ──
  {
    id: '1', name: 'Bench Press', equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps',
    instructions: [
      'Lie flat on a bench with your feet on the floor.',
      'Grip the bar slightly wider than shoulder-width, palms facing away.',
      'Unrack the bar and hold it over your chest with arms extended.',
      'Lower the bar slowly to mid-chest, keeping elbows at about 75 degrees.',
      'Press the bar back up to full arm extension without locking elbows.',
    ],
  },
  {
    id: '2', name: 'Incline Bench Press', equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps',
    instructions: [
      'Set the bench to a 30-45 degree incline.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack and hold the bar above your upper chest.',
      'Lower the bar to your upper chest, keeping elbows tucked slightly.',
      'Press the bar back up to full extension.',
    ],
  },
  {
    id: '3', name: 'Dumbbell Bench Press', equipment: 'Dumbbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps',
    instructions: [
      'Lie flat on a bench holding a dumbbell in each hand at chest level.',
      'Press the dumbbells up until your arms are fully extended.',
      'Lower the dumbbells slowly until elbows are at bench level.',
      'Keep a slight arch in your back and feet flat on the floor.',
      'Press back up, bringing the dumbbells slightly together at the top.',
    ],
  },
  {
    id: '4', name: 'Dumbbell Fly', equipment: 'Dumbbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps',
    instructions: [
      'Lie flat on a bench holding dumbbells above your chest with slight elbow bend.',
      'Lower the dumbbells out to the sides in a wide arc.',
      'Feel the stretch across your chest at the bottom.',
      'Squeeze your chest to bring the dumbbells back together above you.',
      'Keep a slight bend in your elbows throughout the movement.',
    ],
  },
  {
    id: '5', name: 'Cable Fly', equipment: 'Machine', muscle_group: 'Chest', exercise_type: 'Weight & Reps',
    instructions: [
      'Set the cables to shoulder height or higher.',
      'Stand in the center, one foot forward for balance.',
      'Grip the handles and step forward to create tension.',
      'Bring your hands together in front of your chest in a hugging motion.',
      'Slowly return to the starting position, feeling the chest stretch.',
    ],
  },
  {
    id: '6', name: 'Push Ups', equipment: 'None', muscle_group: 'Chest', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulder-width.',
      'Keep your body in a straight line from head to heels.',
      'Lower your chest toward the floor by bending your elbows.',
      'Push back up to the starting position.',
      'Keep your core tight and avoid sagging your hips.',
    ],
  },
  {
    id: '7', name: 'Incline Push Ups', equipment: 'None', muscle_group: 'Chest', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Place your hands on an elevated surface like a bench or step.',
      'Walk your feet back so your body is at an angle.',
      'Lower your chest toward the surface by bending your elbows.',
      'Push back up to the starting position.',
      'The higher the surface, the easier the exercise.',
    ],
  },

  // ── Shoulders ──
  {
    id: '8', name: 'Overhead Press', equipment: 'Barbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand with feet shoulder-width apart, grip the bar at collarbone height.',
      'Brace your core and press the bar straight overhead.',
      'Lock out your arms fully without leaning back excessively.',
      'Lower the bar back to the starting position under control.',
      'Keep your wrists straight and elbows under the bar.',
    ],
  },
  {
    id: '9', name: 'Dumbbell Shoulder Press', equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit on a bench with back support, holding dumbbells at shoulder height.',
      'Press the dumbbells upward until arms are fully extended.',
      'Lower the dumbbells back to shoulder level slowly.',
      'Keep your core engaged and avoid arching your lower back.',
      'Don\'t let the dumbbells drift forward or backward.',
    ],
  },
  {
    id: '10', name: 'Lateral Raise', equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand with dumbbells at your sides, palms facing inward.',
      'Raise your arms out to the sides until they reach shoulder height.',
      'Lead with your elbows, keeping a slight bend in your arms.',
      'Pause briefly at the top, then lower slowly.',
      'Avoid using momentum or swinging your body.',
    ],
  },
  {
    id: '11', name: 'Front Raise', equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding dumbbells in front of your thighs, palms facing your body.',
      'Raise one or both arms forward until they reach shoulder height.',
      'Keep your arms straight with a slight bend at the elbow.',
      'Lower the weight slowly back to the starting position.',
      'Don\'t swing your torso to generate momentum.',
    ],
  },
  {
    id: '12', name: 'Face Pull', equipment: 'Machine', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Set a cable pulley to upper chest height with a rope attachment.',
      'Grip the rope with both hands, palms facing each other.',
      'Pull the rope toward your face, separating your hands as you pull.',
      'Squeeze your shoulder blades together at the end of the movement.',
      'Slowly return to the starting position with control.',
    ],
  },
  {
    id: '13', name: 'Arnold Press', equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit holding dumbbells at chest height with palms facing you.',
      'As you press up, rotate your palms to face forward.',
      'Continue pressing until arms are fully extended overhead.',
      'Reverse the rotation as you lower the dumbbells back to start.',
      'This hits all three heads of the deltoid.',
    ],
  },

  // ── Back ──
  {
    id: '14', name: 'Barbell Row', equipment: 'Barbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps',
    instructions: [
      'Hinge at the hips with a slight knee bend, grip the bar overhand.',
      'Keep your back flat and core braced throughout.',
      'Pull the bar toward your lower chest/upper abdomen.',
      'Squeeze your shoulder blades together at the top.',
      'Lower the bar slowly without rounding your back.',
    ],
  },
  {
    id: '15', name: 'Dumbbell Row', equipment: 'Dumbbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps',
    instructions: [
      'Place one knee and hand on a bench for support.',
      'Hold the dumbbell in the opposite hand with arm extended.',
      'Pull the dumbbell up toward your hip, leading with your elbow.',
      'Squeeze your back muscles at the top of the movement.',
      'Lower the dumbbell slowly to the starting position.',
    ],
  },
  {
    id: '16', name: 'Pull Ups', equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Hang from a bar with palms facing away, hands shoulder-width apart.',
      'Pull yourself up by driving your elbows down and back.',
      'Continue until your chin clears the bar.',
      'Lower yourself slowly back to a full hang.',
      'Avoid swinging or using momentum to get up.',
    ],
  },
  {
    id: '17', name: 'Chin Ups', equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Hang from a bar with palms facing toward you, hands shoulder-width apart.',
      'Pull yourself up by bending your elbows and engaging your biceps.',
      'Continue until your chin is above the bar.',
      'Lower yourself slowly with control.',
      'Keep your core tight to reduce swinging.',
    ],
  },
  {
    id: '18', name: 'Lat Pulldown', equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit at the lat pulldown machine and grip the bar wider than shoulder-width.',
      'Lean back slightly and pull the bar down to your upper chest.',
      'Drive your elbows down and back to engage your lats.',
      'Slowly return the bar to the starting position.',
      'Don\'t lean too far back or use momentum.',
    ],
  },
  {
    id: '19', name: 'Seated Cable Row', equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit at the cable row machine with feet on the foot plates.',
      'Grip the handle with arms extended, back straight.',
      'Pull the handle toward your abdomen, squeezing your shoulder blades.',
      'Keep your torso upright throughout the movement.',
      'Slowly extend your arms back to the starting position.',
    ],
  },
  {
    id: '20', name: 'Deadlift', equipment: 'Barbell', muscle_group: 'Lower Back', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot.',
      'Bend at hips and knees, grip the bar just outside your knees.',
      'Keep your chest up and back flat throughout the lift.',
      'Drive through your heels to stand up, keeping the bar close to your body.',
      'Lock out at the top with hips fully extended, then lower with control.',
    ],
  },

  // ── Arms ──
  {
    id: '21', name: 'Barbell Curl', equipment: 'Barbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding a barbell with underhand grip, arms fully extended.',
      'Curl the bar up by bending your elbows, keeping upper arms stationary.',
      'Squeeze your biceps at the top of the movement.',
      'Lower the bar slowly back to the starting position.',
      'Avoid swinging your body to lift the weight.',
    ],
  },
  {
    id: '22', name: 'Dumbbell Curl', equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding dumbbells at your sides, palms facing forward.',
      'Curl one or both dumbbells up by bending your elbows.',
      'Rotate your wrist slightly outward at the top for a peak contraction.',
      'Lower the dumbbells slowly back to the starting position.',
      'Keep your elbows pinned to your sides throughout.',
    ],
  },
  {
    id: '23', name: 'Hammer Curl', equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding dumbbells at your sides with palms facing each other.',
      'Curl the dumbbells up without rotating your wrists.',
      'Keep your palms facing each other throughout the movement.',
      'Squeeze at the top and lower slowly.',
      'This targets the brachialis and brachioradialis.',
    ],
  },
  {
    id: '24', name: 'Tricep Pushdown', equipment: 'Machine', muscle_group: 'Triceps', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand at a cable machine with a straight or rope attachment.',
      'Grip the attachment with elbows bent at 90 degrees.',
      'Push the attachment down until your arms are fully extended.',
      'Squeeze your triceps at the bottom of the movement.',
      'Slowly return to the starting position without flaring your elbows.',
    ],
  },
  {
    id: '25', name: 'Skull Crushers', equipment: 'Barbell', muscle_group: 'Triceps', exercise_type: 'Weight & Reps',
    instructions: [
      'Lie on a bench holding a barbell above your chest with arms extended.',
      'Keep your upper arms stationary and bend your elbows.',
      'Lower the bar toward your forehead by bending only at the elbows.',
      'Stop just before the bar touches your forehead.',
      'Extend your arms back to the starting position.',
    ],
  },
  {
    id: '26', name: 'Tricep Dips', equipment: 'None', muscle_group: 'Triceps', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Support yourself on parallel bars or a bench edge with arms straight.',
      'Lower your body by bending your elbows to about 90 degrees.',
      'Keep your torso upright to emphasize triceps over chest.',
      'Push yourself back up to the starting position.',
      'Don\'t go too deep to protect your shoulders.',
    ],
  },

  // ── Legs ──
  {
    id: '27', name: 'Barbell Squat', equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps',
    instructions: [
      'Place the bar on your upper traps, stand with feet shoulder-width apart.',
      'Brace your core and initiate the squat by pushing hips back.',
      'Descend until your thighs are at least parallel to the floor.',
      'Drive through your whole foot to stand back up.',
      'Keep your chest up and knees tracking over your toes.',
    ],
  },
  {
    id: '28', name: 'Goblet Squat', equipment: 'Kettlebell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps',
    instructions: [
      'Hold a kettlebell or dumbbell at chest height with both hands.',
      'Stand with feet slightly wider than shoulder-width apart.',
      'Squat down, pushing your hips back and keeping your chest up.',
      'Descend until your elbows are inside your knees.',
      'Drive through your heels to stand back up.',
    ],
  },
  {
    id: '29', name: 'Leg Press', equipment: 'Machine', muscle_group: 'Glutes', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit in the leg press machine with your back flat against the pad.',
      'Place your feet shoulder-width apart on the platform.',
      'Release the safety locks and lower the platform toward your chest.',
      'Press the platform back up without locking your knees.',
      'Don\'t let your lower back lift off the pad.',
    ],
  },
  {
    id: '30', name: 'Romanian Deadlift', equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding a barbell at hip height with a slight knee bend.',
      'Hinge at the hips, pushing them backward while keeping your back flat.',
      'Lower the bar along your legs until you feel a deep hamstring stretch.',
      'Drive your hips forward to return to the starting position.',
      'Keep the bar close to your body throughout.',
    ],
  },
  {
    id: '31', name: 'Leg Curl', equipment: 'Machine', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps',
    instructions: [
      'Lie face down on the leg curl machine with the pad behind your ankles.',
      'Curl your legs up toward your glutes by bending your knees.',
      'Squeeze your hamstrings at the top of the movement.',
      'Lower the weight slowly back to the starting position.',
      'Keep your hips pressed into the pad throughout.',
    ],
  },
  {
    id: '32', name: 'Leg Extension', equipment: 'Machine', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit in the leg extension machine with the pad on your shins.',
      'Extend your legs until they are nearly straight.',
      'Squeeze your quadriceps at the top for a moment.',
      'Lower the weight slowly back to the starting position.',
      'Don\'t lock your knees completely at the top.',
    ],
  },
  {
    id: '33', name: 'Calf Raise', equipment: 'Machine', muscle_group: 'Calves', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand on the calf raise machine with the balls of your feet on the edge.',
      'Lower your heels below the platform for a full stretch.',
      'Push up onto your toes as high as possible.',
      'Squeeze your calves at the top for a moment.',
      'Lower slowly back to the stretched position.',
    ],
  },
  {
    id: '34', name: 'Walking Lunges', equipment: 'Dumbbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps',
    instructions: [
      'Stand holding dumbbells at your sides.',
      'Step forward with one leg and lower your hips until both knees are at 90 degrees.',
      'The back knee should hover just above the ground.',
      'Push off the front foot and step the back foot forward into the next lunge.',
      'Alternate legs as you walk forward.',
    ],
  },

  // ── Core ──
  {
    id: '35', name: 'Plank', equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Duration',
    instructions: [
      'Start in a push-up position but rest on your forearms.',
      'Keep your body in a straight line from head to heels.',
      'Engage your core by pulling your belly button toward your spine.',
      'Don\'t let your hips sag or pike up.',
      'Hold the position for the target duration.',
    ],
  },
  {
    id: '36', name: 'Crunches', equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Lie on your back with knees bent and feet flat on the floor.',
      'Place your hands behind your head or across your chest.',
      'Lift your shoulders off the floor by contracting your abs.',
      'Don\'t pull on your neck — let your abs do the work.',
      'Lower slowly back to the starting position.',
    ],
  },
  {
    id: '37', name: 'Russian Twist', equipment: 'Plate', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps',
    instructions: [
      'Sit on the floor with knees bent and feet slightly elevated.',
      'Lean back slightly to engage your core.',
      'Hold a weight at your chest and twist your torso to one side.',
      'Rotate to the other side in a controlled motion.',
      'Keep your core tight throughout the movement.',
    ],
  },
  {
    id: '38', name: 'Hanging Leg Raise', equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Hang from a pull-up bar with arms fully extended.',
      'Raise your legs by flexing your hips until they are parallel to the floor.',
      'For an advanced version, bring your toes to the bar.',
      'Lower your legs slowly back to the starting position.',
      'Avoid swinging — control the movement with your core.',
    ],
  },
  {
    id: '39', name: 'Ab Rollout', equipment: 'Plate', muscle_group: 'Abdominals', exercise_type: 'Bodyweight Reps',
    instructions: [
      'Kneel on the floor and grip the ab wheel or barbell.',
      'Roll the wheel forward, extending your body as far as you can.',
      'Keep your core tight and don\'t let your hips sag.',
      'Pull yourself back to the starting position using your abs.',
      'Start with a short range of motion and increase as you get stronger.',
    ],
  },

  // ── Cardio ──
  {
    id: '40', name: 'Running', equipment: 'None', muscle_group: 'Cardio', exercise_type: 'Distance & Duration',
    instructions: [
      'Start with a 5-minute warm-up walk or light jog.',
      'Maintain an upright posture with a slight forward lean.',
      'Land on your midfoot, not your heel.',
      'Keep your arms relaxed and swinging naturally.',
      'Gradually increase pace or distance over time.',
    ],
  },
  {
    id: '41', name: 'Cycling', equipment: 'Machine', muscle_group: 'Cardio', exercise_type: 'Distance & Duration',
    instructions: [
      'Adjust the seat height so your knee is slightly bent at the bottom.',
      'Keep your back straight and shoulders relaxed.',
      'Pedal with a smooth, circular motion.',
      'Maintain a steady cadence of 70-90 RPM.',
      'Alternate between seated and standing for varied intensity.',
    ],
  },
  {
    id: '42', name: 'Rowing', equipment: 'Machine', muscle_group: 'Cardio', exercise_type: 'Distance & Duration',
    instructions: [
      'Strap your feet in and grip the handle with overhand grip.',
      'Drive with your legs first, then lean back slightly and pull to your chest.',
      'Reverse the motion: arms extend, lean forward, then bend your knees.',
      'Maintain a strong, upright posture throughout.',
      'Focus on leg drive — it provides 60% of the power.',
    ],
  },
  {
    id: '43', name: 'Jump Rope', equipment: 'None', muscle_group: 'Cardio', exercise_type: 'Duration',
    instructions: [
      'Hold the rope handles at hip height with elbows close to your body.',
      'Rotate the rope with your wrists, not your arms.',
      'Jump just high enough to clear the rope — about 1-2 inches.',
      'Land softly on the balls of your feet.',
      'Keep a steady rhythm and gradually increase speed.',
    ],
  },
  {
    id: '44', name: 'Stair Climber', equipment: 'Machine', muscle_group: 'Cardio', exercise_type: 'Duration',
    instructions: [
      'Stand upright with a slight forward lean.',
      'Step onto the pedals and maintain a steady pace.',
      'Push through your heels to engage glutes and hamstrings.',
      'Keep your hands light on the rails — don\'t lean on them.',
      'Maintain an upright posture throughout the workout.',
    ],
  },
];

export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  Abdominals: '🫁',
  Abductors: '🦵',
  Adductors: '🦵',
  Biceps: '💪',
  Calves: '🦵',
  Cardio: '❤️',
  Chest: '🫁',
  Forearms: '💪',
  'Full Body': '🏃',
  Glutes: '🍑',
  Hamstrings: '🦵',
  Lats: '🔙',
  'Lower Back': '🔙',
  Neck: '🦒',
  Shoulders: '🏋️',
  Traps: '🔙',
  Triceps: '💪',
};
