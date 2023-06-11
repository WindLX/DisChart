use crate::{model::point::Point, utils::error::Error};
use office::{DataType, Excel};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PointSet {
    role: usize,
    id: usize,
    system_time: usize,
    local_time: usize,
    voltage: f64,
    points: Vec<Point>,
}

impl PointSet {
    pub fn new(
        role: usize,
        id: usize,
        system_time: usize,
        local_time: usize,
        voltage: f64,
    ) -> Self {
        PointSet {
            role,
            id,
            system_time,
            local_time,
            voltage,
            points: Vec::new(),
        }
    }

    pub async fn load(path: PathBuf, worksheet_name: Arc<str>) -> Result<Vec<Self>, Error> {
        task::spawn_blocking(move || {
            let mut excel = Excel::open(path)?;
            let workbook = excel.worksheet_range(&worksheet_name)?;
            let mut data = workbook.rows();
            data.next();
            let data = data
                .map(|row| {
                    let role = parse_i64(&row[0])? as usize;
                    let id = parse_i64(&row[1])? as usize;
                    let system_time = parse_i64(&row[2])? as usize;
                    let local_time = parse_i64(&row[3])? as usize;
                    let voltage = parse_f64(&row[4])?;
                    let points = row[6..]
                        .chunks(5)
                        .map(|data| {
                            let role = parse_i64(&data[0])? as usize;
                            let id = parse_i64(&data[1])? as usize;
                            let pos_x = parse_f64(&data[2])?;
                            let pos_y = parse_f64(&data[3])?;
                            let pos_z = parse_f64(&data[4])?;
                            Ok(Point::new(role, id, pos_x, pos_y, pos_z))
                        })
                        .collect::<Result<Vec<Point>, Error>>();
                    let mut pointset = PointSet::new(role, id, system_time, local_time, voltage);
                    pointset.extend(points?);
                    Ok(pointset)
                })
                .collect::<Result<Vec<PointSet>, Error>>();
            data
        })
        .await?
    }

    pub fn set_system_time(&mut self, system_time: usize) {
        self.system_time = system_time;
    }

    pub fn get_system_time(&self) -> usize {
        self.system_time
    }

    pub fn set_local_time(&mut self, local_time: usize) {
        self.local_time = local_time;
    }

    pub fn get_local_time(&self) -> usize {
        self.local_time
    }

    pub fn set_voltage(&mut self, voltage: f64) {
        self.voltage = voltage
    }

    pub fn get_voltage(&self) -> f64 {
        self.voltage
    }

    pub fn get_id(&self) -> usize {
        self.id
    }

    pub fn get_role(&self) -> usize {
        self.role
    }

    pub fn append(&mut self, point: Point) {
        self.points.push(point)
    }

    pub fn extend(&mut self, points: Vec<Point>) {
        self.points.extend(points)
    }

    pub fn node_count(&self) -> usize {
        self.points.len()
    }

    pub fn get(&self, index: usize) -> Result<&Point, Error> {
        if index >= self.points.len() {
            Err(Error::Index(format!("Index out of bounds: {index}")))
        } else {
            Ok(&self.points[index])
        }
    }
}

pub struct PointSetIterator {
    points: std::vec::IntoIter<Point>,
}

impl IntoIterator for PointSet {
    type Item = Point;
    type IntoIter = PointSetIterator;

    fn into_iter(self) -> Self::IntoIter {
        PointSetIterator {
            points: self.points.into_iter(),
        }
    }
}

impl Iterator for PointSetIterator {
    type Item = Point;

    fn next(&mut self) -> Option<Self::Item> {
        self.points.next()
    }
}

fn parse_f64(data_cell: &DataType) -> Result<f64, Error> {
    match data_cell {
        DataType::Float(r) => Ok(*r),
        other => Err(Error::Type(format!("Invalid excel data type [{other:?}]"))),
    }
}

fn parse_i64(data_cell: &DataType) -> Result<i64, Error> {
    match data_cell {
        DataType::Int(r) => Ok(*r),
        DataType::Float(r) => Ok(*r as i64),
        other => Err(Error::Type(format!("Invalid excel data type [{other:?}]"))),
    }
}
