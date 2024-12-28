"use client";
import React, { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const App = () => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [username, setUsername] = useState<string>('');
    const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
    const [allusers, setAllUsers] = useState<{ id: string; name: string; x: number; y: number }[]>([]);
    const [showDialog, setShowDialog] = useState<boolean>(true);
    const [userPosition, setUserPosition] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

    useEffect(() => {
        const socket = new WebSocket('wss://ws-back-39mx.onrender.com');
        setWs(socket);

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'userUpdate') {
                setAllUsers(message.users);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        socket.onerror = (error) => {
            console.error(`WebSocket error: ${error}`);
        };

        return () => {
            socket.close();
        };
    }, []);

    const handleUsernameSubmit = () => {
        if (username.trim() !== '' && ws && !allusers.some(user => user.name === username.trim())) {
            const message = {
                type: 'setUsername',
                username: username.trim(),
            };
            ws.send(JSON.stringify(message));
            setIsUsernameSet(true);
            setShowDialog(false);
        } else {
            alert("Username is either empty or already taken.");
        }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
        setUserPosition((prevPos) => {
            let newX = prevPos.x;
            let newY = prevPos.y;

            if (event.key === 'ArrowUp') {
                newY = Math.max(0, prevPos.y - 10);
            } else if (event.key === 'ArrowDown') {
                newY = Math.min(window.innerHeight - 50, prevPos.y + 10);
            } else if (event.key === 'ArrowLeft') {
                newX = Math.max(0, prevPos.x - 10);
            } else if (event.key === 'ArrowRight') {
                newX = Math.min(window.innerWidth - 50, prevPos.x + 10);
            }

            if (ws) {
                const message = {
                    type: 'moveBox',
                    userId: username,
                    x: newX,
                    y: newY,
                };
                ws.send(JSON.stringify(message));
            }

            return { x: newX, y: newY };
        });
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [userPosition, ws, username]);

    return (
        <div className="map-container">
            {isUsernameSet ? (
                <div className="user-count"></div>
            ) : (
                <AlertDialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Enter Your Username</AlertDialogTitle>
                            <AlertDialogDescription>
                                Please enter a username to join the collaborative map.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setShowDialog(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUsernameSubmit}>Set Username</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {isUsernameSet && (
                <div>
                    {allusers.map((user) => (
                        <div
                            key={user.id}
                            style={{
                                position: 'absolute',
                                top: `${user.y}px`,
                                left: `${user.x}px`,
                                width: '50px',
                                height: '50px',
                                backgroundColor: 'skyblue',
                                borderRadius: '5px',
                                textAlign: 'center',
                                lineHeight: '50px',
                            }}
                        >
                            {user.name[0]}
                        </div>
                    ))}

                    <div
                        style={{
                            position: 'absolute',
                            top: `${userPosition.y}px`,
                            left: `${userPosition.x}px`,
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'lightgreen',
                            borderRadius: '5px',
                            textAlign: 'center',
                            lineHeight: '50px',
                        }}
                    >
                        {username[0]}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
