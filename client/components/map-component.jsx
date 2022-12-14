import React from 'react';
import { GoogleMap, LoadScript, Autocomplete, Marker } from '@react-google-maps/api';
import Log from './log';
import AppContext from '../lib/app-context';
import LogLists from './places';
import PhotoUpload from './photo-upload';
import ViewPhotos from './photo-lists';
import PageContainer from './page-container';
import parseRoute from '../lib/parse-route';
import AuthForm from './auth-form';

const containerStyle = {
  position: 'absolute',
  top: '0',
  bottom: '0',
  right: '0',
  left: '0'
};

const options = {
  disableDefaultUI: true,
  zoomControl: true
};

const libraries = ['places'];

export default class MapComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstLoad: true,
      userLat: null,
      userLong: null,
      markerPosition: null,
      name: '',
      user: false,
      logModal: false,
      logs: [],
      uploadPhoto: false,
      selectedId: null,
      viewPhotos: false,
      signUp: false,
      route: parseRoute(window.location.hash)
    };

    this.autocomplete = null;
    this.onLoad = this.onLoad.bind(this);
    this.onPlaceChanged = this.onPlaceChanged.bind(this);
    this.nullValue = this.nullValue.bind(this);
    this.showLogModal = this.showLogModal.bind(this);
    this.hideLogModal = this.hideLogModal.bind(this);
    this.addLog = this.addLog.bind(this);
    this.resetCoord = this.resetCoord.bind(this);
    this.renderPage = this.renderPage.bind(this);
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(userCoords => {
      this.setState({ userLat: userCoords.coords.latitude, userLong: userCoords.coords.longitude, firstLoad: false });
    });

    fetch('/api/log/')
      .then(result => result.json())
      .then(logs => this.setState({ logs }));

    window.addEventListener('hashchange', () => {
      this.setState({
        route: parseRoute(window.location.hash)
      });
    });
  }

  onLoad(autocomplete) {
    this.autocomplete = autocomplete;
  }

  onPlaceChanged(e) {
    if (this.autocomplete !== null) {
      const place = this.autocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const name = place.name;
      this.setState({ markerPosition: { lat, lng }, name });
    }
  }

  addLog(newLog) {
    const option = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newLog)
    };

    fetch('/api/log/', option)
      .then(res => res.json())
      .then(newLog => {
        const updateLogs = this.state.logs.concat(newLog);
        this.setState({ logs: updateLogs });
      })
      .catch(err => {
        console.error('Error in POST', err);
      });
  }

  nullValue(e) {
    if (e.target.value === '') {
      this.setState({ markerPosition: null, name: null });
    }
  }

  showLogModal(e) {
    if (e.target.name === 'logModal' && !this.state.logModal) {
      this.setState({ logModal: true });
    } else if (e.target.getAttribute('name') === 'cancel' && this.state.logModal) {
      this.setState({ logModal: false });
    } else if (e.target.name === 'add-photo') {
      this.setState({ uploadPhoto: true, selectedId: Number(e.target.attributes.value.value) });
    } else if (e.target.name === 'view-photos') {
      this.setState({ viewPhotos: true, selectedId: Number(e.target.attributes.value.value) });
    } else if (e.target.className === 'sign') {
      this.setState({ signUp: true });
    }
  }

  resetCoord(lat, lng) {
    this.setState({ userLat: lat, userLong: lng });
  }

  hideLogModal() {
    if (this.state.logModal) {
      this.setState({ logModal: false, markerPosition: null, name: '' });
    }
    if (this.state.uploadPhoto) {
      this.setState({ uploadPhoto: false });
    }
    if (this.state.selectedId) {
      this.setState({ selectedId: null });
    }
    if (this.state.viewPhotos) {
      this.setState({ viewPhotos: false });
    }
    if (this.state.signUp) {
      this.setState({ signUp: false });
    }
  }

  renderPage() {
    const { path } = this.state.route;
    if (path === 'sign-up' || path === 'sign-in') {
      return <AuthForm />;
    }
  }

  render() {
    if (this.state.firstLoad) return <div className="lds-ring"><div></div><div></div><div></div><div></div></div>;
    let myLatLng;
    if (this.state.markerPosition) {
      myLatLng = this.state.markerPosition;
    } else {
      myLatLng = {
        lat: this.state.userLat,
        lng: this.state.userLong
      };
    }
    const { markerPosition, name, logModal, logs, selectedId, route } = this.state;
    const { showLogModal, hideLogModal, resetCoord } = this;
    const contextValue = { markerPosition, name, logModal, logs, selectedId, route, showLogModal, hideLogModal, resetCoord };
    const loading = <div className="lds-ring"><div></div><div></div><div></div><div></div></div>;

    return (

      <AppContext.Provider value={contextValue}>
        <>
          <LoadScript
            googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            loadingElement={loading}
          >

            <GoogleMap
              mapContainerStyle={containerStyle}
              center={myLatLng}
              zoom={9}
              options={options}
            >
              <Autocomplete
                onLoad={this.onLoad}
                onPlaceChanged={this.onPlaceChanged}
              >
                <div>
                  <input
                    type='text'
                    placeholder='Enter a place &amp; select one'
                    className='input-style'
                    value={this.name}
                    onChange={this.nullValue}
                  />
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
              </Autocomplete>
              { this.state.markerPosition &&
                <Marker
                position={this.state.markerPosition}
                /> }
              <a href="#sign-up"><img src='/images/2037710.png' className='sign' onClick={showLogModal}></img></a>
              { this.state.logs.length > 0 && <LogLists logs={this.state.logs} /> }
              { this.state.name && <button className="save" name='logModal' onClick={this.showLogModal}>SAVE</button> }
              { this.state.logModal && <Log onSubmit={this.addLog} /> }
              { this.state.uploadPhoto && <PhotoUpload /> }
              { this.state.viewPhotos && <ViewPhotos /> }
              { this.state.signUp &&
                <PageContainer
                  key={route.path}
                  action={route.path}
                >
                  { this.renderPage() }
                </PageContainer>
              }
            </GoogleMap>
          </LoadScript>
        </>
      </AppContext.Provider>
    );
  }
}
MapComponent.contextType = AppContext;
