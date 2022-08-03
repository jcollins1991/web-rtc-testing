
const socket = io(window.location.origin);

let selectedUser;

const onUpdateUserList = ({ userIds }) => {
  const usersList = document.querySelector('#usersList');
  const usersToDisplay = userIds.filter(id => id !== socket.id);
  usersList.innerHTML = '';

  usersToDisplay.forEach(user => {
    const userItem = document.createElement('div');
    userItem.innerHTML = user;
    userItem.className = 'user-item';

    userItem.addEventListener('click', () => {
      selectedUser = user;
    });
    usersList.appendChild(userItem);
  });
};

socket.on('update-user-list', onUpdateUserList);

const createPeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org"
      }
    ]
  });
};

const peer = createPeerConnection();

const onSocketConnect = async () => {
  document.querySelector('#userId').innerHTML = `My user id is ${socket.id}`

  const constraints = {
    audio: true,
    video: true
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  document.querySelector('#localVideo').srcObject = stream;
  stream.getTracks().forEach(track => peer.addTrack(track, stream));

  callButton.disabled = false;
};

socket.on('connect', onSocketConnect);

const call = async () => {
  callButton.disabled = true;

  const localPeerOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));
  socket.emit('mediaOffer', {
    offer: localPeerOffer,
    from: socket.id,
    to: selectedUser
  })
};

const callButton = document.querySelector('#call');
callButton.addEventListener('click', call);

const onMediaOffer = async (data) => {
  try {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const peerAnswer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

    socket.emit('mediaAnswer', {
      answer: peerAnswer,
      from: socket.id,
      to: data.from
    });
  } catch (error) {
    // Handle error
  }
};

socket.on('mediaOffer', onMediaOffer);

const onMediaAnswer = async data => {
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
};

socket.on('mediaAnswer', onMediaAnswer);

const onIceCandidateEvent = event => {
  socket.emit('iceCandidate', {
    to: selectedUser,
    candidate: event.candidate
  });
};

peer.onicecandidate = onIceCandidateEvent;

const onRemotePeerIceCandidate = async data => {
  try {
    const candidate = new RTCIceCandidate(data.candidate);
    await peer.addIceCandidate(candidate);
  } catch (error) {
    // Handle error
  }
};

socket.on('remotePeerIceCandidate', onRemotePeerIceCandidate)

const gotRemoteStream = event => {
  const [stream] = event.streams;
  document.querySelector('#remoteVideo').srcObject = stream;
};

peer.addEventListener('track', gotRemoteStream);
