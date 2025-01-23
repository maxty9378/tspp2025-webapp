import React, {useState, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Coins, Trophy, Star} from 'lucide-react';
import {POWERUP_CONFIG} from '../../config/powerUpConfig';
import { shouldReduceAnimations } from '../../utils/platform';

const {MAX_ENERGY} = POWERUP_CONFIG;

interface PowerUpGameProps {
    onPowerUp: (x: number, y: number) => void;
    energy: number;
    coins: number;
    level: number;
}

const PowerUpGame = ({onPowerUp, energy, coins, level}: PowerUpGameProps) => {
    const [floatingNumbers, setFloatingNumbers] = useState<Array<{
        id: number;
        value: number;
        x: number;
        y: number;
    }>>([]);
    const numberIdCounter = useRef(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isClicking, setIsClicking] = useState(false);
    const reduceAnimations = shouldReduceAnimations();

    const handleClick = (event: React.MouseEvent) => {
        if (energy <= 0) return;
        if (event.buttons > 1) return;

        const rect = imageRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.nativeEvent.offsetX;
        const y = event.nativeEvent.offsetY;

        const baseCoins = Math.floor(Math.random() * 3) + 1;
        const coinsEarned = Math.round(baseCoins * level);

        // Reduce animations on low-end devices
        const numFloatingNumbers = reduceAnimations ? 3 : 8;
        const animationDuration = reduceAnimations ? 0.5 : 1;

        const newNumbers = Array.from({ length: numFloatingNumbers }, () => ({
            id: numberIdCounter.current++,
            value: coinsEarned,
            x: x + (Math.random() - 0.5) * (reduceAnimations ? 20 : 40),
            y: y + (Math.random() - 0.5) * (reduceAnimations ? 20 : 40),
            rotation: Math.random() * 360
        }));

        setFloatingNumbers(prev => [...prev, ...newNumbers]);

        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 100);

        setTimeout(() => {
            setFloatingNumbers(hearts => hearts.filter(heart => !newNumbers.find(h => h.id === heart.id)));
        }, animationDuration * 1000);

        onPowerUp(x, y);
    };

    return (
        <div className="relative bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4 rounded-lg shadow-lg">
            <motion.div className="relative flex justify-center items-center select-none" onClick={handleClick} style={{minHeight: '380px'}}>
                <AnimatePresence>
                    {floatingNumbers.map(({id, value, x, y}) => (
                        <motion.div
                            key={id}
                            initial={{scale: 1, opacity: 1}}
                            animate={{
                                scale: 0.5,
                                y: -100,
                                opacity: 0,
                                x: Math.random() * 40 - 20
                            }}
                            transition={{
                                duration: 1,
                                ease: "easeOut"
                            }}
                            className="absolute flex items-center gap-1 text-amber-400 font-bold pointer-events-none z-50"
                            style={{left: x, top: y, transform: 'translate(-50%, -50%)'}}
                        >
                            <Coins className="w-4 h-4"/>
                            +{value}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {energy <= 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg z-10">
                        <div className="bg-slate-800/90 border border-emerald-primary/20 rounded-lg p-6 text-center max-w-sm mx-auto">
                            <h3 className="text-lg font-medium text-red-300 mb-2">
                                Недостаточно энергии!
                            </h3>
                            <p className="text-sm text-slate-300">
                                Подождите пока энергия восстановится
                            </p>
                            <div className="mt-4 text-sm text-slate-400">
                                Восстановление: {Math.floor(POWERUP_CONFIG.ENERGY_REGEN_RATE * 60)} единиц в минуту
                            </div>
                            <div className="mt-4">
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-emerald-primary/50" animate={{width: `${(energy / MAX_ENERGY) * 100}%`}} transition={{type: "spring", stiffness: 100}}/>
                                </div>
                                <div className="mt-2 text-sm text-slate-400">
                                    {Math.floor(energy)}/{MAX_ENERGY}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative w-[380px] h-[380px] flex items-center justify-center">
                    <motion.img ref={imageRef} src="https://static.tildacdn.com/tild3838-3837-4131-b836-333837326233/___1.png" alt="Click target" className="w-full h-full object-contain select-none pointer-events-none" animate={{scale: isClicking ? 0.95 : 1,}} transition={{type: "spring", stiffness: 500, damping: 30, mass: 1}} draggable={false}/>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                        <motion.div className={`h-full ${
                            energy > MAX_ENERGY * 0.75 ? 'bg-amber-400' : energy > MAX_ENERGY * 0.5 ? 'bg-emerald-400' : energy > MAX_ENERGY * 0.25 ? 'bg-emerald-primary' : 'bg-emerald-600/80'}`} animate={{width: `${(energy / 100) * 100}%`}} transition={{type: "spring", stiffness: 100}}/>
                    </div>
                    <div className="mt-1 text-xs text-slate-400 text-center">
                        Энергия: {Math.floor(energy)}/{MAX_ENERGY}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

interface PowerUpStatsProps {
    coins: number;
    energy: number;
    level: number;
    experience: number;
}

const PowerUpStats = ({coins, energy, level, experience}: PowerUpStatsProps) => {
    const experienceNeeded = level * 100;
    const experiencePercent = (experience / experienceNeeded) * 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-emerald-primary"/>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Уровень силы</div>
                            <div className="text-xl font-bold text-emerald-light">{level}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400">Опыт</div>
                        <div className="text-xl font-bold text-emerald-light">
                            {experience}/{experienceNeeded}
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-emerald-primary" initial={{width: 0}} animate={{width: `${experiencePercent}%`}} transition={{type: "spring", stiffness: 100}}/>
                </div>
            </div>

            <div className="card p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-emerald-primary"/>
                            <span className="text-sm text-slate-400">Энергия</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-light">
                            {Math.floor(energy)}/{MAX_ENERGY}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <motion.div animate={{rotate: [0, 360]}} transition={{duration: 2, repeat: Infinity, ease: "linear"}}>
                                <Star className="w-4 h-4 text-amber-400"/>
                            </motion.div>
                            <span className="text-sm text-slate-400">DOIRP Coin</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-light">{coins}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export {PowerUpGame, PowerUpStats};