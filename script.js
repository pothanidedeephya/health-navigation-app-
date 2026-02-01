let userLat, userLng;
let hospitalLat, hospitalLng;
let hospitalPhone = "";

function initMap() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: userLat, lng: userLng },
        zoom: 15,
      });

      new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map,
        title: "Your Location",
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      findNearestHospital(map);
    },
    () => alert("Please allow location access")
  );
}

function findNearestHospital(map) {
  const service = new google.maps.places.PlacesService(map);

  service.nearbySearch(
    { location: { lat: userLat, lng: userLng }, radius: 5000, type: "hospital" },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const hospital = results[0];
        hospitalLat = hospital.geometry.location.lat();
        hospitalLng = hospital.geometry.location.lng();

        new google.maps.Marker({
          position: hospital.geometry.location,
          map,
          title: hospital.name,
        });

        getHospitalDetails(hospital.place_id);
      }
    }
  );
}

function getHospitalDetails(placeId) {
  const service = new google.maps.places.PlacesService(document.createElement("div"));

  service.getDetails(
    { placeId, fields: ["name", "formatted_phone_number"] },
    (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        document.getElementById("hospital-name").innerText = "🏥 " + place.name;
        hospitalPhone = place.formatted_phone_number || "";
        document.getElementById("hospital-phone").innerText =
          hospitalPhone ? "📞 " + hospitalPhone : "📞 Phone not available";
      }
    }
  );
}

function callHospital() {
  if (hospitalPhone) window.location.href = "tel:" + hospitalPhone;
}

function navigateHospital() {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hospitalLat},${hospitalLng}&travelmode=driving`;
  window.open(url, "_blank");
}
