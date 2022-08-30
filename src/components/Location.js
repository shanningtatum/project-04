import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import mapImage from "../assets/home-location-map.png";
import axios from "axios";
import Loading from "./Loading";

function Location({
  apiKey,
  mapState,
  geocodingLayer,
  setGeocodingLayer,
  geocodingLayerDefined,
  setGeocodingLayerDefined,
}) {
  const [location, setLocation] = useState("");
  const [predictiveResults, setPredictiveResults] = useState([]);
  const [displayMessage, setDisplayMessage] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const navigate = useNavigate();


  const searchLocation = (e) => {
    const { value } = e.target;
    setLocation(value);
    setDisplayMessage("");

    // as user is typing, we will read their value and call the predictive text
    // api to predict their text
    if (value.length > 1) {
      predictiveText(value);
    } else {
      setPredictiveResults([]);
      document.querySelector(".userLocationDiv").classList.remove("active");
      document
        .querySelector(".locationPredictiveResults ul")
        .classList.remove("active");
    }
  };

  // API call for predictive text
  const predictiveText = (location) => {
    axios({
      url: `http://www.mapquestapi.com/search/v3/prediction`,
      params: {
        key: apiKey,
        q: location,
        collection: "address",
      },
      dataType: "JSON",
      method: "GET",
    }).then((response) => {
      setPredictiveResults("");

      if (response.data.results) {
        // store results in state, and take predictive results and map it
        const locationResults = response.data.results;
        setPredictiveResults(locationResults);

        //adds classlist of active for the predictive text results so it has appropriate display property
        document.querySelector(".userLocationDiv").classList.add("active");
        document
          .querySelector(".locationPredictiveResults ul")
          .classList.add("active");
          
          document.addEventListener("click", function () {
            document
              .querySelector(".locationPredictiveResults ul")
              .classList.remove("active");
            setPredictiveResults([]);
            document
              .querySelector(".userLocationDiv")
              .classList.remove("active");
          });
        
        // if (!location) {
        //   document.addEventListener("click", function () {
        //     document
        //       .querySelector(".locationPredictiveResults ul")
        //       .classList.remove("active");
        //     setPredictiveResults([]);
        //     document
        //       .querySelector(".userLocationDiv")
        //       .classList.remove("active");
        //   });
        // }
      } else {

        setDisplayMessage("No valid results...");
        togglePopup();
      }
    })
   .catch(
    (err)=>{
     
      setDisplayMessage(`There is somthing wrong, we get ${err.message}`);
      togglePopup();

    }
   )
  };

  // if user selects an address from the drop down, auto fills the input field for them
  const autoFill = (e) => {
    setLocation(e.target.textContent);
    setPredictiveResults([]);
    document.querySelector(".userLocationDiv").classList.remove("active");
    document
      .querySelector(".locationPredictiveResults ul")
      .classList.remove("active");
  };

  // a function which enables users to find their current location on the map 
  function setLocationMarker(latitude, longtitude) {
    window.L.mapquest
      .geocoding()
      .geocode(`${latitude},${longtitude}`, (error, response) => {
        if (!geocodingLayerDefined) {
          setGeocodingLayerDefined(true);
          setGeocodingLayer(
            window.L.mapquest
              .geocodingLayer({
                geocodingResponse: response,
              })
              .addTo(mapState)
          );
          
        } else {
          geocodingLayer.setGeocodingResponse(response);
        }
      });
  }

  const getGeoLocation = (location) => {
    // we need to set the country, lets strict to canada &  us only
    // String to store for the user's current location

    setLoadingState(true); // after clicking enter, loading animation starts

    // API call for getGeoLocation; convert user's input into coordinates
      if (location !== "") {
        axios({
          url: `https://www.mapquestapi.com/geocoding/v1/address`,
          params: {
            key: apiKey,
            location: location,
          },
        })
          .then((response) => {
            // added catch thing ( setLoadingState= false, error message )
            if (response.data.results) {
              setTimeout(() => {
                setLoadingState(false);
              }, 500); // loading page time = 0.5s+ api response time  (<0.2s)

              // An array of the possible locations best matching the query
              const locationsArray = response.data.results[0].locations;

              const selectedLocationIndex = 0; // THIS VARIABLE CAN STORE THE USER'S SELECTED LOCATION INDEX

              if (response.data.results[0].length < 1) {
                // implement the error handlikng for when user types random string of letters
              } else {
                const currentLongitude =
                  locationsArray[selectedLocationIndex].latLng.lng; 

                const currentLatitutde =
                  locationsArray[selectedLocationIndex].latLng.lat;

                setLocationMarker(currentLatitutde, currentLongitude);

                navigate(`/location/${currentLongitude}, ${currentLatitutde}`);
              }
            } else {
              alert("no result found");
            }
          })
          .catch((err) => {
            setLoadingState(false);
            setDisplayMessage(`You may have ${err.message} err, please try again later..`);
            togglePopup();
          });
      } else {
        setLoadingState(false);
        setDisplayMessage("Please enter your address.");
        togglePopup();
      }
    
  };

  const handleSubmit = (e, location) => {
    e.preventDefault();
    getGeoLocation(location);
  };

  const getLocation = () => {
    sessionStorage.removeItem("reloading");
    setLoadingState(true);
    navigator.geolocation.getCurrentPosition(
      // if location is enabled by user, otherwise
      // run second call back function
      (pos) => {
        setTimeout(() => {
          setLoadingState(false);
        }, 500); // loading page time = 0.5s+ api response time  (<0.2s)
        navigate(`/location/${pos.coords.longitude}, ${pos.coords.latitude}`);
        setLocationMarker(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setDisplayMessage(
          "We need your location to give you a better experience. Please refresh your browser to enable location settings."
        );
        togglePopup();
        setLoadingState(false);
      }
    );
  };

  const togglePopup = () => {
    const locationPopup = document.querySelector(".locationPopup");
    locationPopup.classList.toggle("active");
  };

  //if API is called (loadingState=true), displaying loading page
  return (
    <>
      {loadingState === false ? (
        <>
          <section className="locationSection">
            <div className="wrapper">
              <div className="locationPopup">
                <div className="locationPopupContent">
                  <h3>Error</h3>
                  <img src={mapImage} alt="" />
                  <p>{displayMessage}</p>
                  <div className="popupButtons">
                    <button className="findLocation" onClick={togglePopup}>
                      Ok
                    </button>
                  </div>
                </div>
              </div>
              <div className="locationForm">
                <div className="locationFormHeader">
                  <Link to={"/"} className="returnToMain returnLinks">
                    <FontAwesomeIcon icon={faAngleLeft} />
                    &nbsp;Return to Main Page
                  </Link>
                  <button className="findLocation" onClick={getLocation}>
                    Find My Location
                  </button>
                </div>
                <form onSubmit={(e) => handleSubmit(e, location)}>
                  <div className="userLocationDiv">
                    <label htmlFor="name" className="sr-only">
                      Enter your location
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="userLocationInput"
                      onChange={searchLocation}
                      value={location}
                      placeholder="Enter Your Location"
                      required
                    />
                    <div onClick={(e) => handleSubmit(e, location)}>
                      <FontAwesomeIcon className="searchIcon" icon={faSearch} />
                      <span className="sr-only">Submit your location</span>
                    </div>
                  </div>
                </form>
                <div className="locationPredictiveResults">
                  <ul tabIndex="0">
                    {predictiveResults.map((result, index) => {
                      return (
                        <li key={index} onClick={autoFill} tabIndex="0">
                          {result.displayString}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="wrapper">
          <Loading />
        </div>
      )}
    </>
  );
}

export default Location;
