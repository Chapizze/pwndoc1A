import io from 'socket.io-client';
import { Loading } from 'quasar';

const socket = io(`${window.location.protocol}//${window.location.hostname}:${process.env.API_PORT}`);

socket.on('disconnect', (error) => {
  Loading.show({
    message: 'Disconnected from Backend', 
    spinner: null, 
    backgroundColor: 'red-10', 
    customClass: 'loading-error',
    delay: 5000
  });
});

socket.on('connect', () => {    
  Loading.hide();
});


export { socket };