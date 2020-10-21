'use strict';

const fs = require('fs');
const dissolve = require('geojson-dissolve');

const splitDir = "split-dir";

let baseGeojsonObj = {
    type: "FeatureCollection",
    name: "baseGeoJsonObj",
    crs: {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    features: []
}

let processFile = (_err, _data) => {
    let hangjeong = JSON.parse(_data);
    let features = hangjeong.features;
    let filteredFeatures = [];
    features.forEach((_item) => {
        let properties = _item.properties;
        // console.log("PROPERTY : ", properties)
        let splitAdmNm = properties.adm_nm.split(" ");
        let bigAdmNm = splitAdmNm[0];
        let smallAdmNm = splitAdmNm[1];
        //동 이름 ㅋㅋ
        let smallerAdmNm = splitAdmNm[2];

        // bigAdmNm can be replaced 'sidonm'
        !fs.existsSync(splitDir + "/" + bigAdmNm) && fs.mkdirSync(splitDir + "/" + bigAdmNm);

        !fs.existsSync(splitDir + "/" + bigAdmNm + "/" + smallAdmNm) && fs.mkdirSync(splitDir + "/" + bigAdmNm + "/" + smallAdmNm);
        delete baseGeojsonObj[features];

        baseGeojsonObj.features = [];
        baseGeojsonObj.features.push(_item);

        fs.writeFileSync(splitDir + "/" + bigAdmNm + "/" + smallAdmNm + "/" + smallerAdmNm + ".geojson", JSON.stringify(baseGeojsonObj));
    });

    fs.readdirSync(splitDir).forEach((_bigFolder) => {
        delete baseGeojsonObj[features];
        baseGeojsonObj.features = [];
        fs.readdirSync(splitDir + "/" + _bigFolder).forEach((_smallFolder) => {
            let geojsons = [];
            fs.readdirSync(splitDir + "/" + _bigFolder + "/" + _smallFolder).forEach((_file) => {
                if( ! fs.lstatSync(splitDir + "/" + _bigFolder + "/" + _smallFolder).isDirectory() ) {
                    return;
                }
                let content = fs.readFileSync(splitDir + "/" + _bigFolder + "/" + _smallFolder + "/" + _file, 'utf8');
                let geojson = JSON.parse(content);
                geojsons.push(geojson);
            });

            let unitedGeometry = dissolve(geojsons)

            let feature = {};
            feature.type = "Feature";
            feature.properties = {
                OBJECTID: "0",
                adm_nm: _smallFolder
            };
            feature.geometry = unitedGeometry;
            baseGeojsonObj.features.push(feature);


        }); // end of small Folder
        fs.writeFileSync(splitDir + "/" + _bigFolder + "/" + _bigFolder + ".geojson", JSON.stringify(baseGeojsonObj));
    });// end of big Folder
};
fs.readFile('./hangjeong.geojson', processFile);



