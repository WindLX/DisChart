use crate::{
    model::{point_set::PointSet, target::TargetPointId},
    utils::error::Error,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistanceSet {
    main_point_id: usize,
    distances: Vec<(usize, f64)>,
    count: usize,
}

impl DistanceSet {
    pub fn new(
        point_set: &PointSet,
        target_point_id: &TargetPointId,
        distance_threshold: f64,
        is_3d: bool,
    ) -> Result<Self, Error> {
        let mut count = 0;
        let main_point_id = target_point_id.clone().get_main();
        let other_point_id = target_point_id.clone().get_other();
        let main_point = point_set.get(main_point_id)?.clone();
        let distances = other_point_id
            .into_iter()
            .map(|id| {
                let distance = main_point.distance(point_set.get(id)?.clone(), is_3d);
                if distance >= distance_threshold {
                    count += 1;
                }
                Ok((id, distance))
            })
            .collect::<Result<Vec<(usize, f64)>, Error>>()?;
        Ok(DistanceSet {
            main_point_id,
            distances,
            count,
        })
    }
}
